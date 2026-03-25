import pb from '@/lib/pocketbase/client'
import { Module, Lesson, Material, Quiz, QuizQuestion } from '@/types'

export const getCourseModules = async (courseId: string) => {
  return await pb.collection('modules').getFullList<Module>({
    filter: `course="${courseId}"`,
    sort: 'order,created',
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
    sort: 'order,created',
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

export const getCourseQuizzes = async (courseId: string) => {
  return await pb.collection('quizzes').getFullList<Quiz>({
    filter: `module.course="${courseId}"`,
    sort: 'order,created',
  })
}

export const createQuiz = async (data: Partial<Quiz>) => {
  return await pb.collection('quizzes').create<Quiz>(data)
}

export const deleteQuiz = async (id: string) => {
  return await pb.collection('quizzes').delete(id)
}

export const getQuizQuestions = async (quizId: string) => {
  return await pb.collection('quiz_questions').getFullList<QuizQuestion>({
    filter: `quiz="${quizId}"`,
    sort: 'created',
  })
}

export const createQuizQuestion = async (data: Partial<QuizQuestion>) => {
  return await pb.collection('quiz_questions').create<QuizQuestion>(data)
}

export const deleteQuizQuestion = async (id: string) => {
  return await pb.collection('quiz_questions').delete(id)
}
