import pb from '@/lib/pocketbase/client'
import { ProfessionalCase, CaseComment, CaseLike } from '@/types'

export const getCases = async () => {
  return await pb.collection('professional_cases').getFullList<ProfessionalCase>({
    sort: '-created',
    expand: 'user',
  })
}

export const getCase = async (id: string) => {
  return await pb.collection('professional_cases').getOne<ProfessionalCase>(id, {
    expand: 'user',
  })
}

export const createCase = async (data: { user: string; title: string; content: string }) => {
  return await pb.collection('professional_cases').create<ProfessionalCase>(data)
}

export const getComments = async (caseId: string) => {
  return await pb.collection('case_comments').getFullList<CaseComment>({
    filter: `case="${caseId}"`,
    sort: 'created',
    expand: 'user',
  })
}

export const createComment = async (data: { case: string; user: string; content: string }) => {
  return await pb.collection('case_comments').create<CaseComment>(data)
}

export const getLikesForCases = async (caseIds: string[]) => {
  if (caseIds.length === 0) return []
  const filter = caseIds.map((id) => `case="${id}"`).join(' || ')
  return await pb.collection('case_likes').getFullList<CaseLike>({ filter })
}

export const toggleLike = async (caseId: string, userId: string) => {
  try {
    const existing = await pb
      .collection('case_likes')
      .getFirstListItem<CaseLike>(`case="${caseId}" && user="${userId}"`)
    await pb.collection('case_likes').delete(existing.id)
    return { liked: false }
  } catch {
    await pb.collection('case_likes').create<CaseLike>({ case: caseId, user: userId })
    return { liked: true }
  }
}
