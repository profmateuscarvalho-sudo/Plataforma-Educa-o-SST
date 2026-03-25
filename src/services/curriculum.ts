import pb from '@/lib/pocketbase/client'
import { Module, Lesson, Material } from '@/types'

export const getCourseModules = async (courseId: string) => {
  return await pb.collection('modules').getFullList<Module>({
    filter: `course="${courseId}"`,
    sort: 'created',
  })
}

export const createModule = async (data: Partial<Module>) => {
  return await pb.collection('modules').create<Module>(data)
}

export const updateModule = async (id: string, data: Partial<Module>) => {
  return await pb.collection('modules').update<Module>(id, data)
}

export const deleteModule = async (id: string) => {
  return await pb.collection('modules').delete(id)
}

export const getCourseLessons = async (courseId: string) => {
  return await pb.collection('lessons').getFullList<Lesson>({
    filter: `module.course="${courseId}"`,
    sort: 'created',
  })
}

export const createLesson = async (data: Partial<Lesson>) => {
  return await pb.collection('lessons').create<Lesson>(data)
}

export const deleteLesson = async (id: string) => {
  return await pb.collection('lessons').delete(id)
}

export const getCourseMaterials = async (courseId: string) => {
  return await pb.collection('materials').getFullList<Material>({
    filter: `module.course="${courseId}"`,
    sort: '-created',
  })
}

export const createMaterial = async (data: FormData) => {
  return await pb.collection('materials').create<Material>(data)
}

export const deleteMaterial = async (id: string) => {
  return await pb.collection('materials').delete(id)
}
