import pb from '@/lib/pocketbase/client'
import { DocProject } from '@/types'

export const getDocProjects = () =>
  pb.collection('doc_projects').getFullList<DocProject>({ sort: '-created' })

export const getDocProject = (id: string) => pb.collection('doc_projects').getOne<DocProject>(id)

export const createDocProject = (data: Partial<DocProject> | FormData) =>
  pb.collection('doc_projects').create<DocProject>(data)

export const updateDocProject = (id: string, data: Partial<DocProject> | FormData) =>
  pb.collection('doc_projects').update<DocProject>(id, data)

export const deleteDocProject = (id: string) => pb.collection('doc_projects').delete(id)
