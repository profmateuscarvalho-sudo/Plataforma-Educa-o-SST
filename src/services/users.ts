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

export const updateUserProfile = async (userId: string, data: Record<string, any>) => {
  return await pb.collection('users').update<User>(userId, data)
}

export const resendActivationEmail = async (userId: string, planTier?: string) => {
  return await pb.send('/backend/v1/admin/resend-activation', {
    method: 'POST',
    body: JSON.stringify({ userId, plan_tier: planTier }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const deleteStudent = async (userId: string) => {
  return await pb.send(`/backend/v1/admin/students/${userId}`, {
    method: 'DELETE',
  })
}
