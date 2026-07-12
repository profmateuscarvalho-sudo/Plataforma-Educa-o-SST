import pb from '@/lib/pocketbase/client'
import { StudentNote } from '@/types'

export const getStudentNotes = async (userId: string) => {
  return await pb.collection('student_notes').getFullList<StudentNote>({
    filter: `user="${userId}"`,
    sort: '-updated',
  })
}

export const createStudentNote = async (data: Partial<StudentNote>) => {
  return await pb.collection('student_notes').create<StudentNote>(data)
}

export const updateStudentNote = async (id: string, data: Partial<StudentNote>) => {
  return await pb.collection('student_notes').update<StudentNote>(id, data)
}

export const deleteStudentNote = async (id: string) => {
  await pb.collection('student_notes').delete(id)
}
