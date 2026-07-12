import pb from '@/lib/pocketbase/client'
import { ProfessionalCase, CaseComment } from '@/types'

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
