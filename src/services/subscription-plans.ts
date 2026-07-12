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

export const createSubscriptionPlan = async (data: Partial<SubscriptionPlan>) => {
  return await pb.collection('subscription_plans').create<SubscriptionPlan>(data)
}

export const updateSubscriptionPlan = async (id: string, data: Partial<SubscriptionPlan>) => {
  return await pb.collection('subscription_plans').update<SubscriptionPlan>(id, data)
}

export const deleteSubscriptionPlan = async (id: string) => {
  return await pb.collection('subscription_plans').delete(id)
}
