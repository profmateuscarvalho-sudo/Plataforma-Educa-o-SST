import pb from '@/lib/pocketbase/client'
import { Payment } from '@/types'

export const getUserPayments = async (userId: string) => {
  return await pb.collection('payments').getFullList<Payment>({
    filter: `user="${userId}"`,
    sort: '-created',
  })
}
