import pb from '@/lib/pocketbase/client'
import { Lead } from '@/types'

export const createLead = async (data: Partial<Lead>) => {
  return await pb.collection('leads').create<Lead>(data)
}

export const getLeads = async () => {
  return await pb.collection('leads').getFullList<Lead>({ sort: '-created' })
}
