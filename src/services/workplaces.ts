import pb from '@/lib/pocketbase/client'
import type { Workplace } from '@/types'

export const getWorkplaces = async () => {
  return pb.collection('workplaces').getFullList<Workplace>({ sort: '-created' })
}

export const createWorkplace = async (data: FormData) => {
  return pb.collection('workplaces').create<Workplace>(data)
}

export const deleteWorkplace = async (id: string) => {
  return pb.collection('workplaces').delete(id)
}
