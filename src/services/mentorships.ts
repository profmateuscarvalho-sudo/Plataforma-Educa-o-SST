import pb from '@/lib/pocketbase/client'
import { Mentorship } from '@/types'

export const getMentorships = async () => {
  return await pb
    .collection('mentorships')
    .getFullList<Mentorship>({ sort: '-created', expand: 'mentor' })
}

export const getMentorship = async (id: string) => {
  return await pb.collection('mentorships').getOne<Mentorship>(id, { expand: 'mentor' })
}

export const createMentorship = async (data: Partial<Mentorship> | Record<string, any>) => {
  return await pb.collection('mentorships').create<Mentorship>(data)
}

export const updateMentorship = async (
  id: string,
  data: Partial<Mentorship> | Record<string, any>,
) => {
  return await pb.collection('mentorships').update<Mentorship>(id, data)
}

export const deleteMentorship = async (id: string) => {
  return await pb.collection('mentorships').delete(id)
}
