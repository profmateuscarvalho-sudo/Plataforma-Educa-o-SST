import pb from '@/lib/pocketbase/client'
import {
  MentorAvailability,
  MentorBlockedDate,
  MentorshipHorarios,
  MentorshipBooking,
} from '@/types'

// ---------------------------------------------------------------------------
// AGENDA DO MENTOR — mentor_availability e mentor_blocked_dates
// ---------------------------------------------------------------------------

export const getMentorAvailability = async (mentorId: string): Promise<MentorAvailability[]> => {
  try {
    return await pb
      .collection('mentor_availability')
      .getFullList<MentorAvailability>({ filter: `mentor = "${mentorId}"`, sort: 'weekday' })
  } catch (error) {
    console.error('Failed to fetch mentor availability:', error)
    return []
  }
}

export const createAvailability = async (
  data: Partial<MentorAvailability> | Record<string, any>,
) => {
  return await pb.collection('mentor_availability').create<MentorAvailability>(data)
}

export const updateAvailability = async (
  id: string,
  data: Partial<MentorAvailability> | Record<string, any>,
) => {
  return await pb.collection('mentor_availability').update<MentorAvailability>(id, data)
}

export const deleteAvailability = async (id: string) => {
  return await pb.collection('mentor_availability').delete(id)
}

export const getMentorBlockedDates = async (mentorId: string): Promise<MentorBlockedDate[]> => {
  try {
    return await pb
      .collection('mentor_blocked_dates')
      .getFullList<MentorBlockedDate>({ filter: `mentor = "${mentorId}"`, sort: 'date' })
  } catch (error) {
    console.error('Failed to fetch mentor blocked dates:', error)
    return []
  }
}

export const createBlockedDate = async (data: Partial<MentorBlockedDate> | Record<string, any>) => {
  return await pb.collection('mentor_blocked_dates').create<MentorBlockedDate>(data)
}

export const deleteBlockedDate = async (id: string) => {
  return await pb.collection('mentor_blocked_dates').delete(id)
}

// ---------------------------------------------------------------------------
// HORÁRIOS LIVRES — rota protegida GET /backend/v1/mentorias/{id}/horarios
// (mesmo padrão de magazine-read-link / video-link: chamada direta ao backend)
// ---------------------------------------------------------------------------

export const getMentorshipHorarios = async (mentorshipId: string): Promise<MentorshipHorarios> => {
  const res = await pb.send<MentorshipHorarios>(
    `/backend/v1/mentorias/${encodeURIComponent(mentorshipId)}/horarios`,
    { method: 'GET' },
  )
  return res
}

// ---------------------------------------------------------------------------
// BOOKINGS — mentorship_bookings (aluno vê só as próprias; admin todas)
// ---------------------------------------------------------------------------

export const getMyBookings = async (userId: string): Promise<MentorshipBooking[]> => {
  try {
    return await pb.collection('mentorship_bookings').getFullList<MentorshipBooking>({
      filter: `user = "${userId}"`,
      sort: '-start_at',
      expand: 'mentor,mentorship',
    })
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
    return []
  }
}

export const getAllBookings = async (): Promise<MentorshipBooking[]> => {
  try {
    return await pb
      .collection('mentorship_bookings')
      .getFullList<MentorshipBooking>({ sort: '-start_at', expand: 'user,mentor,mentorship' })
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
    return []
  }
}

export const updateBooking = async (
  id: string,
  data: Partial<MentorshipBooking> | Record<string, any>,
) => {
  return await pb.collection('mentorship_bookings').update<MentorshipBooking>(id, data)
}
