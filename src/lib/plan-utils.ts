import { tierFromSubscriptions, type Subscription } from '@/hooks/use-student-access'

const tierRank: Record<string, number> = { free: 1, prata: 2, ouro: 3 }

export interface PlanButtonState {
  label: string
  disabled: boolean
  variant: 'default' | 'outline'
}

export function getPlanButtonState(
  planName: string,
  user:
    | {
        plan_tier?: string
        role?: string
        contract_end_date?: string
        subscriptions?: Subscription[]
      }
    | null
    | undefined,
  isComingSoon?: boolean,
): PlanButtonState {
  if (isComingSoon) {
    return { label: 'Indisponível', disabled: true, variant: 'default' }
  }

  const planTier = planName.toLowerCase()

  if (!user) {
    return planTier === 'free'
      ? { label: 'Começar Grátis', disabled: false, variant: 'default' }
      : { label: 'Assinar Agora', disabled: false, variant: 'default' }
  }

  // Tier efetivo: o maior entre users.plan_tier e o plano da assinatura ativa (se informada)
  const userTier = (user.plan_tier || 'free').toLowerCase()
  const subscriptionTier = tierFromSubscriptions(user.subscriptions || [])
  const hasActiveSub = (user.subscriptions || []).some((s) => s.status === 'active')
  const isActive =
    hasActiveSub ||
    (user.contract_end_date ? new Date(user.contract_end_date) >= new Date() : userTier === 'free')
  const fromSubs = subscriptionTier ? tierRank[subscriptionTier] : 0
  const fromUser = tierRank[userTier] || 1
  const bestTier = fromSubs > fromUser ? subscriptionTier : userTier
  const effectiveTier = user.role === 'admin' ? 'ouro' : isActive ? bestTier : 'free'

  if (effectiveTier === planTier) {
    return { label: 'Plano Atual', disabled: true, variant: 'outline' }
  }

  if (planTier === 'free') {
    return { label: 'Começar Grátis', disabled: false, variant: 'default' }
  }

  return { label: 'Fazer Upgrade', disabled: false, variant: 'default' }
}
