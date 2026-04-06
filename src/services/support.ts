import pb from '@/lib/pocketbase/client'
import { SupportMessage } from '@/types'

export const createSupportMessage = async (data: Partial<SupportMessage>) => {
  return await pb.collection('support_messages').create<SupportMessage>(data)
}

export const getUserSupportMessages = async (userId: string) => {
  return await pb.collection('support_messages').getFullList<SupportMessage>({
    filter: `user="${userId}"`,
    sort: '-created',
  })
}

export const updateSupportMessageStatus = async (id: string, status: 'pending' | 'answered') => {
  return await pb.collection('support_messages').update<SupportMessage>(id, { status })
}
