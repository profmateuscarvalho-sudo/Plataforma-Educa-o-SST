import pb from '@/lib/pocketbase/client'
import { MentorshipBooking, MentorshipHorarios, MentorshipSlot } from '@/types'

// ---------------------------------------------------------------------------
// NOVO MODELO DE AGENDA (slots explícitos — mentorship_slots).
// A agenda semanal recorrente da v0.0.383 (mentor_availability /
// mentor_blocked_dates) ficou FORA DE CENA: nenhum código novo a alimenta.
// ---------------------------------------------------------------------------

function hojeSaoPauloIso(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function mesAtualSaoPaulo(): string {
  return hojeSaoPauloIso().slice(0, 7)
}

/** Horários LIVRES por dia, para o mês: GET /backend/v1/mentorias/{id}/horarios?mes=AAAA-MM */
export const getMentorshipHorarios = async (
  mentorshipId: string,
  mes?: string,
): Promise<MentorshipHorarios> => {
  const m = mes || mesAtualSaoPaulo()
  const res = await pb.send<MentorshipHorarios>(
    `/backend/v1/mentorias/${encodeURIComponent(mentorshipId)}/horarios?mes=${encodeURIComponent(m)}`,
    { method: 'GET' },
  )
  return res
}

/** Todos os slots da mentoria num mês (admin — regra da coleção exige admin) */
export const getMentorshipSlots = async (
  mentorshipId: string,
  mes: string,
): Promise<MentorshipSlot[]> => {
  try {
    const [ano, num] = mes.split('-').map(Number)
    const inicio = new Date(Date.UTC(ano, num - 1, 1, 0, 0, 0) - 3 * 3600 * 1000).toISOString()
    const fim = new Date(Date.UTC(ano, num, 0, 23, 59, 59) - 3 * 3600 * 1000).toISOString()
    return await pb.collection('mentorship_slots').getFullList<MentorshipSlot>({
      filter: `mentorship = "${mentorshipId}" && start_at >= "${inicio}" && start_at <= "${fim}"`,
      sort: 'start_at',
    })
  } catch (error) {
    console.error('Failed to fetch mentorship slots:', error)
    return []
  }
}

export const createSlot = async (data: {
  mentorship: string
  mentor?: string
  start_at: string
  end_at: string
}) => {
  return await pb.collection('mentorship_slots').create<MentorshipSlot>({
    ...data,
    status: 'livre',
  })
}

/** Remove horário LIVRE. Vendido/bloqueado não pode ser removido. */
export const deleteSlot = async (slot: MentorshipSlot) => {
  if (slot.status !== 'livre') {
    throw new Error('Horário vendido não pode ser removido — só cancelando a sessão.')
  }
  return await pb.collection('mentorship_slots').delete(slot.id)
}

/** Copia os horários (hora do dia) de um dia para outras datas, na mesma mentoria */
export const copySlotsFromDay = async (
  mentorshipId: string,
  mentorId: string | undefined,
  origemDia: string,
  horarios: string[],
  destinos: string[],
) => {
  const criados: string[] = []
  for (const destino of destinos) {
    if (destino === origemDia) continue
    for (const h of horarios) {
      const [ano, num, dia] = destino.split('-').map(Number)
      const [hh, mm] = h.split(':').map(Number)
      const start = new Date(Date.UTC(ano, num - 1, dia, hh, mm, 0) - 3 * 3600 * 1000)
      const startIso = start.toISOString()
      // conflito: já existe slot da mesma mentoria no mesmo horário?
      const existentes = await getMentorshipSlots(mentorshipId, destino.slice(0, 7))
      const conflito = existentes.some((s) => {
        const st = String(s.start_at || '')
        return new Date(st).getTime() === start.getTime()
      })
      if (conflito) continue
      const endIso = new Date(start.getTime() + 60 * 60 * 1000).toISOString() // ajustado pelo chamador
      await createSlot({
        mentorship: mentorshipId,
        mentor: mentorId,
        start_at: startIso,
        end_at: endIso,
      })
      criados.push(`${destino} ${h}`)
    }
  }
  return criados
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
