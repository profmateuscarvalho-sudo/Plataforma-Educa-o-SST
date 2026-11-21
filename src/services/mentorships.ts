import pb from '@/lib/pocketbase/client'
import { Mentorship } from '@/types'

// Lista completa — usada pelas telas do aluno (catálogo público, base pequena:
// 2 registros). NÃO usar em telas admin; para elas há getMentorshipsPaged.
export const getMentorships = async (): Promise<Mentorship[]> => {
  try {
    return await pb
      .collection('mentorships')
      .getFullList<Mentorship>({ sort: '-created', expand: 'mentor' })
  } catch (error) {
    console.error('Failed to fetch mentorships:', error)
    return []
  }
}

// Versão paginada no servidor (50 por página) para as telas do admin — antes
// era perPage=1000 e chegou a 45s nos logs de requests.
export const getMentorshipsPaged = async (page = 1, perPage = 50) => {
  try {
    const res = await pb.collection('mentorships').getList<Mentorship>(page, perPage, {
      sort: '-created',
      expand: 'mentor',
    })
    return { items: res.items, totalItems: res.totalItems, totalPages: res.totalPages }
  } catch (error) {
    console.error('Failed to fetch mentorships:', error)
    return { items: [] as Mentorship[], totalItems: 0, totalPages: 0 }
  }
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
