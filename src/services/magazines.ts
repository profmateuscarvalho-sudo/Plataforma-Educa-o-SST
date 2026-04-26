import pb from '@/lib/pocketbase/client'
import { Magazine } from '@/types'

export const getMagazines = async () => {
  return await pb.collection('magazines').getFullList<Magazine>({ sort: '-created' })
}

export const createMagazine = async (data: FormData) => {
  return await pb.collection('magazines').create<Magazine>(data)
}

export const updateMagazine = async (id: string, data: FormData | Partial<Magazine>) => {
  return await pb.collection('magazines').update<Magazine>(id, data)
}

export const deleteMagazine = async (id: string) => {
  if (!id) {
    throw new Error('ID is required to delete a magazine')
  }
  return await pb.collection('magazines').delete(id)
}
