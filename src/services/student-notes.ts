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

/** Toggles the public sharing state of a note. */
export const setNotePublic = async (id: string, isPublic: boolean) => {
  return await pb.collection('student_notes').update<StudentNote>(id, {
    is_public: isPublic,
    shared_at: isPublic ? new Date().toISOString() : null,
  })
}

/** Returns all notes shared publicly by any student (newest first). */
export const getSharedNotes = async () => {
  return await pb.collection('student_notes').getFullList<StudentNote>({
    filter: 'is_public = true',
    sort: '-shared_at',
    expand: 'user',
  })
}
