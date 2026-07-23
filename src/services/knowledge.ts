import pb from '@/lib/pocketbase/client'
import { KnowledgeEntry, KnowledgeSearchResult } from '@/types'

export const getKnowledgeEntries = async () =>
  pb.collection('knowledge_entries').getFullList<KnowledgeEntry>({ sort: '-created' })

export const createKnowledgeEntry = async (data: FormData) =>
  pb.collection('knowledge_entries').create<KnowledgeEntry>(data)

export const updateKnowledgeEntry = async (id: string, data: FormData | Partial<KnowledgeEntry>) =>
  pb.collection('knowledge_entries').update<KnowledgeEntry>(id, data)

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
