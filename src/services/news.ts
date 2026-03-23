import pb from '@/lib/pocketbase/client'
import { News } from '@/types'

export const getNews = async () => {
  return await pb.collection('news').getFullList<News>({ sort: '-created' })
}

export const createNews = async (data: FormData) => {
  return await pb.collection('news').create<News>(data)
}

export const deleteNews = async (id: string) => {
  return await pb.collection('news').delete(id)
}
