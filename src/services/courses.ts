import pb from '@/lib/pocketbase/client'
import { Course } from '@/types'

// Lista completa — usada pelas telas do aluno (base pequena). NÃO usar em
// telas admin para contagem; para isso há getCoursesPaged.
export const getCourses = async (): Promise<Course[]> => {
  return await pb.collection('courses').getFullList<Course>({ sort: '-created' })
}

// Versão paginada no servidor para telas admin / contagens.
export const getCoursesPaged = async (page = 1, perPage = 50) => {
  const res = await pb.collection('courses').getList<Course>(page, perPage, { sort: '-created' })
  return { items: res.items, totalItems: res.totalItems }
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
