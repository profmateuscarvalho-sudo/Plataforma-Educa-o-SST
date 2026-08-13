import { RecordModel } from 'pocketbase'

export interface AccessEvent extends RecordModel {
  user: string
  area: string
  event_type: 'login' | 'page_view'
  meta?: Record<string, unknown>
  expand?: { user?: RecordModel }
}

export type AccessArea =
  | 'Hub'
  | 'Cursos'
  | 'Revistas'
  | 'Mentorias'
  | 'Documentários'
  | 'Aulas ao Vivo'
  | 'Simulados'
  | 'Caderno Virtual'
  | 'Feed de Cases'
  | 'Meu Perfil'
  | (string & {})

/**
 * Registra um evento de acesso (login ou visita a uma área) para o usuário
 * autenticado atual. Falha silenciosamente para não impactar a UX.
 */
export async function trackAccess(
  area: AccessArea,
  eventType: 'login' | 'page_view' = 'page_view',
  meta?: Record<string, unknown>,
) {
  try {
    const { default: pb } = await import('@/lib/pocketbase/client')
    if (!pb.authStore.record) return
    await pb.collection('access_events').create<AccessEvent>({
      user: pb.authStore.record.id,
      area,
      event_type: eventType,
      meta: meta ?? {},
    })
  } catch (e) {
    // no-op: tracking must never break the UX
  }
}

/**
 * Busca todos os eventos de acesso (para o painel admin).
 */
export async function getAccessEvents(days = 30): Promise<AccessEvent[]> {
  const { default: pb } = await import('@/lib/pocketbase/client')
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  // PocketBase expects date literals in "YYYY-MM-DD HH:MM:SS" format (space,
  // not the "T" separator used by toISOString). An ISO string here makes the
  // list request fail with 400 and leaves the dashboard blank.
  const sinceStr = since.toISOString().replace('T', ' ').replace('Z', '')
  return await pb.collection('access_events').getFullList<AccessEvent>({
    filter: `created >= "${sinceStr}"`,
    sort: '-created',
    expand: 'user',
  })
}
