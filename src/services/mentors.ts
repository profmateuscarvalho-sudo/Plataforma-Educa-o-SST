import pb from '@/lib/pocketbase/client'
import { Mentor } from '@/types'

export const getMentors = async (): Promise<Mentor[]> => {
  try {
    return await pb.collection('mentors').getFullList<Mentor>({ sort: '-created' })
  } catch (error) {
    console.error('Failed to fetch mentors:', error)
    return []
  }
}

export const getMentor = async (id: string) => {
  return await pb.collection('mentors').getOne<Mentor>(id)
}

export const createMentor = async (data: Partial<Mentor> | Record<string, any>) => {
  return await pb.collection('mentors').create<Mentor>(data)
}

export const updateMentor = async (id: string, data: Partial<Mentor> | Record<string, any>) => {
  return await pb.collection('mentors').update<Mentor>(id, data)
}

export const deleteMentor = async (id: string) => {
  return await pb.collection('mentors').delete(id)
}
