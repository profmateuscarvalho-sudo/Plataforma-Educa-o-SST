import pb from '@/lib/pocketbase/client'
import { Article, Author, ProfessionalConnection, SubmissionToken } from '@/types'

export const validateToken = async (token: string, type: 'article' | 'connection') => {
  try {
    const record = await pb
      .collection('submission_tokens')
      .getFirstListItem<SubmissionToken>(`token="${token}" && type="${type}"`)
    if (record.used || new Date(record.expires_at) < new Date()) {
      return null
    }
    return record
  } catch {
    return null
  }
}

export const markTokenUsed = async (id: string) => {
  return pb.collection('submission_tokens').update(id, { used: true })
}

export const submitArticle = async (
  authorData: FormData,
  articleData: FormData,
  tokenId: string,
) => {
  const author = await pb.collection('authors').create<Author>(authorData)
  articleData.append('author', author.id)
  const article = await pb.collection('articles').create<Article>(articleData)
  await markTokenUsed(tokenId)
  return article
}

export const submitConnection = async (data: FormData, tokenId: string) => {
  const conn = await pb.collection('professional_connections').create<ProfessionalConnection>(data)
  await markTokenUsed(tokenId)
  return conn
}

export const getArticles = () =>
  pb.collection('articles').getFullList<Article>({ expand: 'author,magazine', sort: '-created' })
export const updateArticleStatus = (id: string, status: string) =>
  pb.collection('articles').update(id, { status })
export const getConnections = () =>
  pb
    .collection('professional_connections')
    .getFullList<ProfessionalConnection>({ sort: '-created' })
export const generateSubmissionLink = (type: 'article' | 'connection') =>
  pb.send<{ token: string }>('/backend/v1/generate-link', { method: 'POST', body: { type } })
