import pb from '@/lib/pocketbase/client'
import { Payment } from '@/types'

export const getPayments = async () => {
  return await pb.collection('payments').getFullList<Payment>({
    sort: '-created',
    expand: 'user',
  })
}

export const getUserPayments = async (userId: string) => {
  return await pb.collection('payments').getFullList<Payment>({
    filter: `user="${userId}"`,
    sort: '-created',
  })
}
