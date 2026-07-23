import pb from '@/lib/pocketbase/client'
import { KnowledgeEntry, KnowledgeSearchResult } from '@/types'

export const getKnowledgeEntries = async () =>
  pb.collection('knowledge_entries').getFullList<KnowledgeEntry>({ sort: '-created' })

export const createKnowledgeEntry = async (data: FormData) => {
  try {
    return await pb.collection('knowledge_entries').create<KnowledgeEntry>(data)
  } catch (error) {
    console.error('[knowledge] createKnowledgeEntry failed:', {
      url: `${import.meta.env.VITE_POCKETBASE_URL}/api/collections/knowledge_entries/records`,
      method: 'POST',
      bodyKeys: Array.from(data.keys()),
      error,
    })
    throw error
  }
}

export const updateKnowledgeEntry = async (
  id: string,
  data: FormData | Partial<KnowledgeEntry>,
) => {
  try {
    return await pb.collection('knowledge_entries').update<KnowledgeEntry>(id, data)
  } catch (error) {
    console.error('[knowledge] updateKnowledgeEntry failed:', {
      url: `${import.meta.env.VITE_POCKETBASE_URL}/api/collections/knowledge_entries/records/${id}`,
      method: 'PATCH',
      bodyKeys: data instanceof FormData ? Array.from(data.keys()) : Object.keys(data),
      error,
    })
    throw error
  }
}

export const deleteKnowledgeEntry = async (id: string) =>
  pb.collection('knowledge_entries').delete(id)

export const reprocessKnowledgeEntry = async (id: string) =>
  pb.send(`/backend/v1/knowledge/reprocess/${id}`, { method: 'POST' })

export const searchKnowledge = async (query: string, tags?: string[], topK?: number) =>
  pb.send<KnowledgeSearchResult[]>('/backend/v1/knowledge/search', {
    method: 'POST',
    body: JSON.stringify({ query, tags, topK }),
    headers: { 'Content-Type': 'application/json' },
  })
