import { useEffect, useState, useMemo } from 'react'
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
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      getUserPayments(user.id).catch(() => []),
      getUserSubscriptions(user.id).catch(() => []),
    ]).then(([p, subs]) => {
      setPayments(p.filter((pay: Payment) => pay.status === 'paid'))
      setSubscriptions(subs as Subscription[])
      setLoading(false)
    })
  }, [user])

  const hasSubscriptionAccess = useMemo(() => {
    if (user?.role === 'admin') return true
    if (subscriptions.some((s) => s.status === 'active')) return true
    if (user?.plan_tier === 'prata' || user?.plan_tier === 'ouro') return true
    if (payments.length > 0) return true
    return false
  }, [user, subscriptions, payments])

  const activeTier = useMemo<PlanTier>(() => {
    if (user?.role === 'admin') return 'ouro'
    if (!hasSubscriptionAccess) return 'none'
    return (user?.plan_tier as PlanTier) || 'free'
  }, [user, hasSubscriptionAccess])

  const hasActiveSubscription = (): boolean => hasSubscriptionAccess

  const canAccess = (requiredTier: PlanTier): boolean => {
    return tierLevel(activeTier) >= tierLevel(requiredTier)
  }

  const hasPurchased = (itemTitle: string): boolean => {
    return payments.some(
      (p) => p.status === 'paid' && p.product_type && p.product_type.includes(itemTitle),
    )
  }

  const getAccessStatus = (item: {
    is_free?: boolean
    title: string
    requiredTier?: PlanTier
  }): AccessStatus => {
    if (item.is_free) return 'free'
    if (activeTier === 'none') return 'locked'
    const required = item.requiredTier || 'prata'
    if (canAccess(required)) return 'subscriber'
    if (hasPurchased(item.title)) return 'owned'
    return 'locked'
  }

  const hasAccess = (item: {
    is_free?: boolean
    title: string
    requiredTier?: PlanTier
  }): boolean => getAccessStatus(item) !== 'locked'

  return {
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
  }
}
