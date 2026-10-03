import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface Subscription extends RecordModel {
  user: string
  status: 'pending' | 'active'
  token: string
  plan: string
}

export interface ActivateSubscriptionResponse {
  success?: boolean
  message?: string
  plan?: string
  accessGranted?: boolean
  token?: string
  record?: Record<string, unknown>
}

export const activateSubscription = async (
  token: string,
): Promise<ActivateSubscriptionResponse> => {
  return await pb.send('/backend/v1/ativar-assinatura', {
    method: 'POST',
    body: JSON.stringify({ token }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const createSubscription = async (userId: string, planId: string) => {
  return await pb.send('/backend/v1/create_subscription', {
    method: 'POST',
    body: { user_id: userId, plan_id: planId },
  })
}

export interface PendingStatus {
  state: 'pending_activation' | 'manual_verification'
  subscription: {
    id: string
    status: string
    token: string
    created: string
  } | null
  emailLog: {
    sent: boolean
    error_message: string
    email_type: string
    created: string
  } | null
}

export const getPendingStatus = (): Promise<PendingStatus> =>
  pb.send('/backend/v1/pending-status', { method: 'GET' })

export const getUserSubscriptions = (userId: string) =>
  pb.collection('subscriptions').getFullList({
    filter: `user = '${userId}'`,
    sort: '-created',
    expand: 'plan',
  })
