import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserPayments } from '@/services/payments'
import { Payment } from '@/types'

export type AccessStatus = 'free' | 'owned' | 'subscriber' | 'locked'
export type PlanTier = 'free' | 'prata' | 'ouro'

const tierLevel = (tier: string): number => {
  switch (tier) {
    case 'ouro':
      return 3
    case 'prata':
      return 2
    default:
      return 1
  }
}

export function useStudentAccess() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    if (!user) return
    getUserPayments(user.id)
      .then((p) => setPayments(p.filter((pay) => pay.status === 'paid')))
      .catch(() => {})
  }, [user])

  const hasActiveSubscription = (): boolean => {
    if (!user?.contract_end_date) return false
    return new Date(user.contract_end_date) >= new Date()
  }

  const activeTier = useMemo<PlanTier>(() => {
    if (user?.role === 'admin') return 'ouro'
    if (!user?.contract_end_date) return 'free'
    if (new Date(user.contract_end_date) < new Date()) return 'free'
    return (user?.plan_tier as PlanTier) || 'prata'
  }, [user])

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
    hasActiveSubscription,
    hasPurchased,
    getAccessStatus,
    hasAccess,
    activeTier,
    canAccess,
  }
}
