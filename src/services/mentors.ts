import pb from '@/lib/pocketbase/client'
import { Mentor } from '@/types'

export const getMentors = () => pb.collection('mentors').getFullList<Mentor>({ sort: '-created' })

export const getMentor = (id: string) => pb.collection('mentors').getOne<Mentor>(id)

export const createMentor = (data: Partial<Mentor> | FormData) =>
  pb.collection('mentors').create<Mentor>(data)

export const updateMentor = (id: string, data: Partial<Mentor> | FormData) =>
  pb.collection('mentors').update<Mentor>(id, data)

export const deleteMentor = (id: string) => pb.collection('mentors').delete(id)
