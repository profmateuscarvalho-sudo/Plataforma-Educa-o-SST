import pb from '@/lib/pocketbase/client'
import {
  DocProject,
  DocProjectCost,
  DocProjectRecording,
  DocProjectTeam,
  DocProjectTask,
} from '@/types'

export const getDocProjects = () =>
  pb.collection('doc_projects').getFullList<DocProject>({ expand: 'responsible', sort: '-created' })
export const getDocProject = (id: string) =>
  pb.collection('doc_projects').getOne<DocProject>(id, { expand: 'responsible' })
export const getDocProjectBySlug = (slug: string) =>
  pb
    .collection('doc_projects')
    .getFirstListItem<DocProject>(`slug = '${slug}'`, { expand: 'responsible' })
export const createDocProject = (data: Partial<DocProject>) =>
  pb.collection('doc_projects').create<DocProject>(data)
export const updateDocProject = (id: string, data: Partial<DocProject> | FormData) =>
  pb.collection('doc_projects').update<DocProject>(id, data)
export const deleteDocProject = (id: string) => pb.collection('doc_projects').delete(id)

export const getDocProjectCosts = (projectId: string) =>
  pb
    .collection('doc_project_costs')
    .getFullList<DocProjectCost>({ filter: `project = '${projectId}'`, sort: 'created' })
export const createDocProjectCost = (data: Partial<DocProjectCost>) =>
  pb.collection('doc_project_costs').create<DocProjectCost>(data)
export const updateDocProjectCost = (id: string, data: Partial<DocProjectCost>) =>
  pb.collection('doc_project_costs').update<DocProjectCost>(id, data)
export const deleteDocProjectCost = (id: string) => pb.collection('doc_project_costs').delete(id)

export const getDocProjectRecordings = (projectId: string) =>
  pb
    .collection('doc_project_recordings')
    .getFullList<DocProjectRecording>({ filter: `project = '${projectId}'`, sort: 'date' })
export const createDocProjectRecording = (data: Partial<DocProjectRecording>) =>
  pb.collection('doc_project_recordings').create<DocProjectRecording>(data)
export const updateDocProjectRecording = (id: string, data: Partial<DocProjectRecording>) =>
  pb.collection('doc_project_recordings').update<DocProjectRecording>(id, data)
export const deleteDocProjectRecording = (id: string) =>
  pb.collection('doc_project_recordings').delete(id)

export const getDocProjectTeam = (projectId: string) =>
  pb
    .collection('doc_project_team')
    .getFullList<DocProjectTeam>({ filter: `project = '${projectId}'`, sort: 'created' })
export const createDocProjectTeam = (data: Partial<DocProjectTeam>) =>
  pb.collection('doc_project_team').create<DocProjectTeam>(data)
export const updateDocProjectTeam = (id: string, data: Partial<DocProjectTeam>) =>
  pb.collection('doc_project_team').update<DocProjectTeam>(id, data)
export const deleteDocProjectTeam = (id: string) => pb.collection('doc_project_team').delete(id)

export const getDocProjectTasks = (projectId: string) =>
  pb
    .collection('doc_project_tasks')
    .getFullList<DocProjectTask>({ filter: `project = '${projectId}'`, sort: 'created' })
export const createDocProjectTask = (data: Partial<DocProjectTask>) =>
  pb.collection('doc_project_tasks').create<DocProjectTask>(data)
export const updateDocProjectTask = (id: string, data: Partial<DocProjectTask>) =>
  pb.collection('doc_project_tasks').update<DocProjectTask>(id, data)
export const deleteDocProjectTask = (id: string) => pb.collection('doc_project_tasks').delete(id)
