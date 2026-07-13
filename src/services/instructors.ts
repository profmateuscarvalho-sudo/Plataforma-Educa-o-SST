import pb from '@/lib/pocketbase/client'
import { Instructor } from '@/types'

export const getInstructors = () =>
  pb.collection('instructors').getFullList<Instructor>({ sort: '-created' })

export const getInstructor = (id: string) => pb.collection('instructors').getOne<Instructor>(id)

export const createInstructor = (data: Partial<Instructor> | FormData) =>
  pb.collection('instructors').create<Instructor>(data)

export const updateInstructor = (id: string, data: Partial<Instructor> | FormData) =>
  pb.collection('instructors').update<Instructor>(id, data)

export const deleteInstructor = (id: string) => pb.collection('instructors').delete(id)
