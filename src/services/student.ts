import pb from '@/lib/pocketbase/client'
import { LessonCompletion, LessonRating } from '@/types'

export const getCompletions = async (userId: string) => {
  return await pb
    .collection('lesson_completions')
    .getFullList<LessonCompletion>({ filter: `user="${userId}"` })
}

export const toggleCompletion = async (
  lessonId: string,
  userId: string,
  isCompleted: boolean,
  completionId?: string,
) => {
  if (isCompleted && completionId) {
    await pb.collection('lesson_completions').delete(completionId)
  } else if (!isCompleted) {
    await pb.collection('lesson_completions').create({ lesson: lessonId, user: userId })
  }
}

export const getLessonRatings = async (lessonId: string) => {
  return await pb
    .collection('lesson_ratings')
    .getFullList<LessonRating>({ filter: `lesson="${lessonId}"`, expand: 'user', sort: '-created' })
}

export const rateLesson = async (data: Partial<LessonRating>) => {
  return await pb.collection('lesson_ratings').create<LessonRating>(data)
}
