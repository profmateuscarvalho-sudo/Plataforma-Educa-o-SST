import pb from '@/lib/pocketbase/client'
import { User } from '@/types'

export const getStudents = async () => {
  return await pb.collection('users').getFullList<User>({
    filter: "role != 'admin'",
    sort: '-created',
  })
}

export const getAdmins = async () => {
  return await pb.collection('users').getFullList<User>({
    filter: "role = 'admin'",
    sort: 'name',
  })
}

export const updateUserPlan = async (userId: string, planTier: string, billing: string) => {
  const isPaid = planTier === 'prata' || planTier === 'ouro'
  const updatedUser = await pb.collection('users').update<User>(userId, {
    plan_tier: planTier,
    subscription_billing: billing,
    ...(isPaid ? { email_verificado: true } : {}),
  })

  if (isPaid) {
    try {
      const subs = await pb.collection('subscriptions').getFullList({
        filter: `user = '${userId}'`,
        sort: '-created',
      })
      for (const sub of subs) {
        if (sub.status !== 'active') {
          await pb.collection('subscriptions').update(sub.id, { status: 'active' })
        }
      }
    } catch {
      /* ignore */
    }
  }

  return updatedUser
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
