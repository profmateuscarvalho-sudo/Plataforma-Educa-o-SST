import pb from '@/lib/pocketbase/client'
import { Magazine } from '@/types'

export const getMagazines = async () => {
  return await pb.collection('magazines').getFullList<Magazine>({ sort: '-created' })
}

export const createMagazine = async (data: FormData) => {
  return await pb.collection('magazines').create<Magazine>(data)
}

export const deleteMagazine = async (id: string) => {
  return await pb.collection('magazines').delete(id)
}
