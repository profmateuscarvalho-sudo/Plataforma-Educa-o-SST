import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface ProfessionalTagOption extends RecordModel {
  name: string
  active: boolean
}

export const getProfessionalTagOptions = async (activeOnly = false) => {
  const filter = activeOnly ? 'active = true' : ''
  return await pb.collection('professional_tag_options').getFullList<ProfessionalTagOption>({
    sort: 'name',
    filter,
  })
}

export const createProfessionalTagOption = async (name: string) => {
  return await pb.collection('professional_tag_options').create<ProfessionalTagOption>({
    name,
    active: true,
  })
}

export const updateProfessionalTagOption = async (
  id: string,
  data: Partial<Pick<ProfessionalTagOption, 'name' | 'active'>>,
) => {
  return await pb.collection('professional_tag_options').update<ProfessionalTagOption>(id, data)
}

export const deleteProfessionalTagOption = async (id: string) => {
  return await pb.collection('professional_tag_options').delete(id)
}
