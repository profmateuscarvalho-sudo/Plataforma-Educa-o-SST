import pb from '@/lib/pocketbase/client'

export const getArticles = () =>
  pb.collection('articles').getFullList({ expand: 'author,magazine', sort: '-created' })

export const updateArticleStatus = (id: string, status: string) =>
  pb.collection('articles').update(id, { status })

export const updateArticle = (id: string, data: any) => pb.collection('articles').update(id, data)

export const getConnections = () =>
  pb.collection('professional_connections').getFullList({ sort: '-created' })

export const updateConnection = (id: string, data: any) =>
  pb.collection('professional_connections').update(id, data)

export const generateSubmissionLink = (type: string, recipientName: string) =>
  pb.send('/backend/v1/generate-link', {
    method: 'POST',
    body: { type, recipient_name: recipientName },
  })

export const getTokens = (type: string) =>
  pb.collection('submission_tokens').getFullList({ filter: `type="${type}"`, sort: '-created' })

export const deleteArticle = (id: string) => pb.collection('articles').delete(id)

export const validateToken = async (token: string, type: string) => {
  try {
    const records = await pb
      .collection('submission_tokens')
      .getFullList({ filter: `token="${token}" && type="${type}" && used=false` })
    const record = records[0] || null
    if (record) {
      // Fix mobile browser date parsing (Safari) by replacing space with 'T'
      const expiresAt = new Date(record.expires_at.replace(' ', 'T'))
      if (expiresAt < new Date()) {
        return null
      }
    }
    return record
  } catch {
    return null
  }
}

export const submitArticle = async (
  authorForm: FormData,
  articleForm: FormData,
  tokenId: string,
) => {
  const author = await pb.collection('authors').create(authorForm)
  articleForm.append('author', author.id)
  await pb.collection('articles').create(articleForm)
  await pb.collection('submission_tokens').update(tokenId, { used: true })
}

export const submitConnection = async (formData: FormData, tokenId: string) => {
  await pb.collection('professional_connections').create(formData)
  await pb.collection('submission_tokens').update(tokenId, { used: true })
}

export const getLatestConnectionQuestions = async (): Promise<string[]> => {
  try {
    const mags = await pb.collection('magazines').getFullList({
      sort: '-created',
    })
    for (const mag of mags) {
      if (
        mag.connection_questions &&
        Array.isArray(mag.connection_questions) &&
        mag.connection_questions.length > 0
      ) {
        return mag.connection_questions
      }
    }
    return [
      'Quais os maiores desafios da sua área atualmente?',
      'Como você vê o futuro da Segurança e Saúde no Trabalho?',
      'Quais conselhos daria para quem está começando na área?',
    ]
  } catch {
    return [
      'Quais os maiores desafios da sua área atualmente?',
      'Como você vê o futuro da Segurança e Saúde no Trabalho?',
      'Quais conselhos daria para quem está começando na área?',
    ]
  }
}
