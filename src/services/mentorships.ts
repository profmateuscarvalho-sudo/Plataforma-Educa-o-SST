import pb from '@/lib/pocketbase/client'
import { Mentorship } from '@/types'

export const getMentorships = async () => {
  return await pb.collection('mentorships').getFullList<Mentorship>({ sort: '-created' })
}
