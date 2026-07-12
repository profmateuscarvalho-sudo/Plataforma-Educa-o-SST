import pb from '@/lib/pocketbase/client'
import { User } from '@/types'

export const getStudents = async () => {
  return await pb.collection('users').getFullList<User>({
    filter: "role != 'admin'",
    sort: '-created',
  })
}
