import pb from '@/lib/pocketbase/client'
import { News } from '@/types'

export const getNews = async () => {
  return await pb.collection('news').getFullList<News>({ sort: '-created' })
}

export const createNews = async (data: FormData) => {
  return await pb.collection('news').create<News>(data)
}

export const updateNews = async (id: string, data: FormData) => {
  if (!id) throw new Error('ID is required to update news')
  return await pb.collection('news').update<News>(id, data)
}

export const getNewsById = async (id: string) => {
  if (!id) throw new Error('ID is required')
  return await pb.collection('news').getOne<News>(id)
}

export const deleteNews = async (id: string) => {
  if (!id) throw new Error('ID is required to delete news')
  return await pb.collection('news').delete(id)
}
