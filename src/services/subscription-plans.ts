import pb from '@/lib/pocketbase/client'
import { SubscriptionPlan } from '@/types'

export const getSubscriptionPlans = async () => {
  return await pb.collection('subscription_plans').getFullList<SubscriptionPlan>({
    sort: 'price',
  })
}

export const getSubscriptionPlan = async (id: string) => {
  return await pb.collection('subscription_plans').getOne<SubscriptionPlan>(id)
}
