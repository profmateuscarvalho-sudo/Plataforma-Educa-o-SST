import pb from '@/lib/pocketbase/client'
import { User } from '@/types'
import { SubscriptionPlan } from '@/types'
import { countLeads } from '@/services/leads'
import { getCoursesPaged } from '@/services/courses'

export interface AdminOverviewStats {
  /** Total de usuários com role = 'student' (contagem no servidor). */
  students: number
  /** Total de cursos (totalItems da coleção courses). */
  courses: number
  /** Total de leads capturados (totalItems da coleção leads). */
  leads: number
  /** Usuários com assinatura ATIVA de plano PAGO (Prata/Ouro) e contrato vigente. */
  activeSubscribers: number
  /** Contas gratuitas: alunos sem plano pago (plan_tier free ou vazio). */
  freeAccounts: number
}

// IDs dos planos pagos (price > 0). Hoje são "Prata" e "Ouro" — o plano "Free"
// tem preço 0 e NÃO conta como assinante ativo.
const paidPlanIds = (plans: SubscriptionPlan[]): string[] =>
  plans.filter((p) => (p.price ?? 0) > 0 || (p.price_yearly ?? 0) > 0).map((p) => p.id)

/** Conta usuários com assinatura ativa de plano pago E contract_end_date no futuro. */
export async function countActivePaidSubscribers(nowIso: string): Promise<number> {
  const plans = await pb
    .collection('subscription_plans')
    .getFullList<SubscriptionPlan>({ sort: '-created' })
  const ids = paidPlanIds(plans)
  if (ids.length === 0) return 0

  const subs = await pb.collection('subscriptions').getFullList<{ user: string }>({
    filter: `status = 'active' && plan in (${ids.map((id) => `'${id}'`).join(',')})`,
  })
  // Usuários distintos — pode haver mais de uma assinatura ativa por usuário.
  const userIds = Array.from(new Set(subs.map((s) => s.user)))
  if (userIds.length === 0) return 0

  // Só vale se o contrato do usuário ainda estiver vigente.
  const res = await pb.collection('users').getList<User>(1, 1, {
    filter: `role = 'student' && contract_end_date > "${nowIso}" && id in (${userIds
      .map((id) => `'${id}'`)
      .join(',')})`,
  })
  return res.totalItems
}

/** Conta contas gratuitas: alunos sem plano pago (plan_tier 'free' ou vazio). */
export async function countFreeStudents(): Promise<number> {
  const res = await pb.collection('users').getList<User>(1, 1, {
    filter: "role = 'student' && plan_tier != 'prata' && plan_tier != 'ouro'",
  })
  return res.totalItems
}

/** Busca todos os números da Visão Geral. Cada contagem é independente: uma
 * falha não derruba as outras (fallback 0). */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const nowIso = new Date().toISOString()
  const [students, courses, leads, activeSubscribers, freeAccounts] = await Promise.all([
    // Total de alunos: contagem no servidor (perPage=1, só totalItems).
    pb
      .collection('users')
      .getList<User>(1, 1, { filter: "role = 'student'" })
      .then((r) => r.totalItems)
      .catch(() => 0),
    // Cursos: totalItems da página (não o objeto paginado inteiro).
    getCoursesPaged(1, 1)
      .then((r) => r.totalItems)
      .catch(() => 0),
    countLeads().catch(() => 0),
    countActivePaidSubscribers(nowIso).catch(() => 0),
    countFreeStudents().catch(() => 0),
  ])
  return { students, courses, leads, activeSubscribers, freeAccounts }
}
