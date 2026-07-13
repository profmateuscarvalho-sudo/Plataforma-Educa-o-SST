import pb from '@/lib/pocketbase/client'
import { User } from '@/types'

export const getStudents = async () => {
  return await pb.collection('users').getFullList<User>({
    filter: "role != 'admin'",
    sort: '-created',
  })
}

export const updateUserPlan = async (userId: string, planTier: string, billing: string) => {
  return await pb.collection('users').update<User>(userId, {
    plan_tier: planTier,
    subscription_billing: billing,
  })
}
