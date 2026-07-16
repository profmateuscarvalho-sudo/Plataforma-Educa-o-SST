const tierRank: Record<string, number> = { free: 1, prata: 2, ouro: 3 }

export interface PlanButtonState {
  label: string
  disabled: boolean
  variant: 'default' | 'outline'
}

export function getPlanButtonState(
  planName: string,
  user: { plan_tier?: string; role?: string; contract_end_date?: string } | null | undefined,
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

  const userTier = (user.plan_tier || 'free').toLowerCase()
  const isActive = user.contract_end_date
    ? new Date(user.contract_end_date) >= new Date()
    : userTier === 'free'
  const effectiveTier = user.role === 'admin' ? 'ouro' : isActive ? userTier : 'free'

  if (effectiveTier === planTier) {
    return { label: 'Plano Atual', disabled: true, variant: 'outline' }
  }

  if (tierRank[effectiveTier] > tierRank[planTier]) {
    return { label: 'Fazer Downgrade', disabled: false, variant: 'outline' }
  }

  if (planTier === 'free') {
    return { label: 'Começar Grátis', disabled: false, variant: 'default' }
  }

  return { label: 'Fazer Upgrade', disabled: false, variant: 'default' }
}
