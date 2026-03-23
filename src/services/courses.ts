import pb from '@/lib/pocketbase/client'
import { Course } from '@/types'

export const getCourses = async () => {
  return await pb.collection('courses').getFullList<Course>({ sort: '-created' })
}

export const getCourse = async (id: string) => {
  return await pb.collection('courses').getOne<Course>(id)
}

export const createCourse = async (data: FormData) => {
  return await pb.collection('courses').create<Course>(data)
}

export const updateCourse = async (id: string, data: FormData) => {
  return await pb.collection('courses').update<Course>(id, data)
}

export const deleteCourse = async (id: string) => {
  return await pb.collection('courses').delete(id)
}
