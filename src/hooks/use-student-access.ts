import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserPayments } from '@/services/payments'
import { getUserSubscriptions, type Subscription } from '@/services/subscriptions'
import { Payment } from '@/types'

export type AccessStatus = 'free' | 'owned' | 'subscriber' | 'locked'
export type PlanTier = 'none' | 'free' | 'prata' | 'ouro'

const tierLevel = (tier: string): number => {
  switch (tier) {
    case 'ouro':
      return 3
    case 'prata':
      return 2
    case 'free':
      return 1
    default:
      return 0
  }
}

export function useStudentAccess() {
  const { user } = useAuth()
  const userId = user?.id
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      getUserPayments(userId).catch(() => []),
      getUserSubscriptions(userId).catch(() => []),
    ]).then(([p, subs]) => {
      setPayments(p.filter((pay: Payment) => pay.status === 'paid'))
      setSubscriptions(subs as Subscription[])
      setLoading(false)
    })
  }, [userId])

  const hasSubscriptionAccess = useMemo(() => {
    if (user?.role === 'admin') return true
    // Assinatura ativa no banco dá acesso
    if (subscriptions.some((s) => s.status === 'active')) return true
    // Usuários com plano pago (prata ou ouro)
    if (user?.plan_tier === 'prata' || user?.plan_tier === 'ouro') return true
    // Usuários com contrato válido
    if (user?.contract_end_date && new Date(user.contract_end_date) >= new Date()) return true
    // Aluno com plano free tem acesso imediato pelo simples fato de estar autenticado (sem exigir confirmação de e-mail)
    if (user?.plan_tier === 'free' || !user?.plan_tier) return true
    // Pagamentos aprovados anteriores
    if (payments.length > 0) return true
    return false
  }, [user, subscriptions, payments])

  const activeTier = useMemo<PlanTier>(() => {
    if (user?.role === 'admin') return 'ouro'
    if (!hasSubscriptionAccess) return 'none'
    return (user?.plan_tier as PlanTier) || 'free'
  }, [user, hasSubscriptionAccess])

  const hasActiveSubscription = useCallback(
    (): boolean => hasSubscriptionAccess,
    [hasSubscriptionAccess],
  )

  const canAccess = useCallback(
    (requiredTier: PlanTier): boolean => {
      return tierLevel(activeTier) >= tierLevel(requiredTier)
    },
    [activeTier],
  )

  const hasPurchased = useCallback(
    (itemTitle: string): boolean => {
      return payments.some(
        (p) => p.status === 'paid' && p.product_type && p.product_type.includes(itemTitle),
      )
    },
    [payments],
  )

  const getAccessStatus = useCallback(
    (item: { is_free?: boolean; title: string; requiredTier?: PlanTier }): AccessStatus => {
      if (item.is_free) return 'free'
      if (activeTier === 'none') return 'locked'
      const required = item.requiredTier || 'prata'
      if (canAccess(required)) return 'subscriber'
      if (hasPurchased(item.title)) return 'owned'
      return 'locked'
    },
    [activeTier, canAccess, hasPurchased],
  )

  const hasAccess = useCallback(
    (item: { is_free?: boolean; title: string; requiredTier?: PlanTier }): boolean =>
      getAccessStatus(item) !== 'locked',
    [getAccessStatus],
  )

  return useMemo(
    () => ({
      payments,
      subscriptions,
      loading,
      hasSubscriptionAccess,
      hasActiveSubscription,
      hasPurchased,
      getAccessStatus,
      hasAccess,
      activeTier,
      canAccess,
    }),
    [
      payments,
      subscriptions,
      loading,
      hasSubscriptionAccess,
      hasActiveSubscription,
      hasPurchased,
      getAccessStatus,
      hasAccess,
      activeTier,
      canAccess,
    ],
  )
}
