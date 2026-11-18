import pb from '@/lib/pocketbase/client'
import { User } from '@/types'
import { SubscriptionPlan } from '@/types'
import { getSubscriptionPlans } from '@/services/subscription-plans'

export const getStudents = async () => {
  // O endpoint custom /backend/v1/admin/students não existe mais no backend —
  // requisições a ele caíam no host estático e davam 404 "File not found".
  // A coleção users expõe e-mail para admins (regra de lista), então lemos
  // diretamente por ela; se algo falhar, repete sem filtro de role.
  try {
    return await pb.collection('users').getFullList<User>({
      filter: "role != 'admin'",
      sort: '-created',
    })
  } catch (err) {
    console.warn('Fallback sem filtro de role em getStudents:', err)
    return await pb.collection('users').getFullList<User>({ sort: '-created' })
  }
}

export const getAdmins = async () => {
  return await pb.collection('users').getFullList<User>({
    filter: "role = 'admin'",
    sort: 'name',
  })
}

// Localiza o subscription_plan cujo nome corresponde ao tier escolhido
// (respeitando o ciclo de cobrança quando informado), como fallback quando o
// painel não tem um plano específico em mãos.
const findPlanIdForTier = async (tier: string, billing: string): Promise<string | null> => {
  const plans = await getSubscriptionPlans()
  const tierLower = tier.toLowerCase()
  const billingLower = billing.toLowerCase()
  const candidates = plans.filter((p: SubscriptionPlan) => p.name.toLowerCase().includes(tierLower))
  if (candidates.length === 0) return null
  const byBilling = candidates.find((p: SubscriptionPlan) =>
    p.name.toLowerCase().includes(billingLower),
  )
  if (byBilling) return byBilling.id
  const nonAnnual = candidates.find(
    (p: SubscriptionPlan) => !p.name.toLowerCase().includes('anual'),
  )
  return nonAnnual ? nonAnnual.id : candidates[0].id
}

// Garante que o aluno tenha exatamente UMA assinatura active, apontando para o
// plano escolhido pelo admin. Corrige o caso em que a assinatura ativa existe
// mas vinculada ao plano errado (ex.: Free em vez de Prata Mensal):
// atualiza o vínculo do registro existente quando possível; caso contrário,
// desativa as antigas e cria uma nova. Também mantém users.plan_tier em sync.
export const applyUserPlan = async (
  userId: string,
  planTier: string,
  billing: string,
  planId?: string,
) => {
  const isPaid = planTier === 'prata' || planTier === 'ouro'

  // Resolve o plano alvo: id explícito > plano correspondente ao tier.
  let targetPlanId = planId || null
  if (!targetPlanId && isPaid) {
    try {
      targetPlanId = await findPlanIdForTier(planTier, billing)
    } catch {
      targetPlanId = null
    }
  }
  if (!targetPlanId && !isPaid) {
    try {
      targetPlanId = await findPlanIdForTier('free', billing)
    } catch {
      targetPlanId = null
    }
  }

  // 1) Atualiza o usuário com o tier escolhido.
  const updatedUser = await pb.collection('users').update<User>(userId, {
    plan_tier: planTier,
    subscription_billing: billing,
    ...(isPaid ? { email_verificado: true } : {}),
  })

  // 2) Sincroniza as assinaturas: uma única ativa, apontando para o plano certo.
  if (targetPlanId) {
    try {
      const subs = await pb.collection('subscriptions').getFullList({
        filter: `user = '${userId}'`,
        sort: '-created',
      })

      const activeSub = subs.find((s) => s.status === 'active')
      if (activeSub) {
        // Já existe uma ativa: corrige o vínculo do plano nela mesma.
        if (activeSub.plan !== targetPlanId) {
          await pb.collection('subscriptions').update(activeSub.id, {
            plan: targetPlanId,
          })
        }
        // Desativa as demais para não deixar duas ativas.
        for (const sub of subs) {
          if (sub.id !== activeSub.id && sub.status === 'active') {
            await pb.collection('subscriptions').update(sub.id, { status: 'inactive' })
          }
        }
      } else {
        // Nenhuma ativa: cria uma nova já ativa apontando para o plano certo.
        await pb.collection('subscriptions').create({
          user: userId,
          plan: targetPlanId,
          status: 'active',
        })
      }
    } catch {
      /* não-bloqueante: o tier do usuário já foi gravado */
    }
  }

  return updatedUser
}

// Compat: mantém a assinatura antiga do painel, agora com o plano certo.
export const updateUserPlan = async (userId: string, planTier: string, billing: string) =>
  applyUserPlan(userId, planTier, billing)

export const updateUserProfile = async (userId: string, data: Record<string, any>) => {
  return await pb.collection('users').update<User>(userId, data)
}

export const resendActivationEmail = async (userId: string, planTier?: string) => {
  return await pb.send('/backend/v1/admin/resend-activation', {
    method: 'POST',
    body: JSON.stringify({ userId, plan_tier: planTier }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const deleteStudent = async (userId: string) => {
  return await pb.send(`/backend/v1/admin/students/${userId}`, {
    method: 'DELETE',
  })
}
