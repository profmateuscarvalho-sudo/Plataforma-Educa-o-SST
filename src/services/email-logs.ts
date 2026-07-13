import pb from '@/lib/pocketbase/client'
import { EmailLog, User } from '@/types'
import { Subscription } from '@/services/subscriptions'

export const getEmailLogs = async () => {
  return await pb.collection('email_logs').getFullList<EmailLog>({
    sort: '-created',
    expand: 'user,subscription',
  })
}

export const getUsersForLog = async () => {
  return await pb.collection('users').getFullList<User>({
    fields: 'id,name,email,email_verificado,plan_tier',
    sort: '-created',
  })
}

export const getSubscriptionsForLog = async () => {
  return await pb.collection('subscriptions').getFullList<Subscription>({
    expand: 'plan',
    sort: '-created',
  })
}
