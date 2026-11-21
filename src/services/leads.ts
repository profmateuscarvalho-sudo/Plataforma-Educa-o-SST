import pb from '@/lib/pocketbase/client'
import { Lead } from '@/types'

export interface PagedLeads {
  items: Lead[]
  totalItems: number
}

export const createLead = async (data: Partial<Lead>) => {
  return await pb.collection('leads').create<Lead>(data)
}

// Lista paginada no servidor (50 por página) — antes baixava a base inteira
// com getFullList para só então filtrar/paginar no cliente.
export const getLeads = async (page = 1, perPage = 50): Promise<PagedLeads> => {
  const res = await pb.collection('leads').getList<Lead>(page, perPage, { sort: '-created' })
  return { items: res.items, totalItems: res.totalItems }
}

// Contagem só do total (totalItems da meta do PocketBase) — usado nos cards
// do dashboard sem baixar registros.
export const countLeads = async (): Promise<number> => {
  const res = await pb.collection('leads').getList<Lead>(1, 1)
  return res.totalItems
}
