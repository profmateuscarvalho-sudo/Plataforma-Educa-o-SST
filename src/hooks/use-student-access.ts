import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserPayments } from '@/services/payments'
import { Payment } from '@/types'

export type AccessStatus = 'free' | 'owned' | 'subscriber' | 'locked'

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

  const hasPurchased = (itemTitle: string): boolean => {
    return payments.some(
      (p) => p.status === 'paid' && p.product_type && p.product_type.includes(itemTitle),
    )
  }

  const getAccessStatus = (item: { is_free?: boolean; title: string }): AccessStatus => {
    if (item.is_free) return 'free'
    if (hasActiveSubscription()) return 'subscriber'
    if (hasPurchased(item.title)) return 'owned'
    return 'locked'
  }

  const hasAccess = (item: { is_free?: boolean; title: string }): boolean =>
    getAccessStatus(item) !== 'locked'

  return { payments, hasActiveSubscription, hasPurchased, getAccessStatus, hasAccess }
}
