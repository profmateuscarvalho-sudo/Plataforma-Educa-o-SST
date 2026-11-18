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
  | 'Ágora de Debates'
  | 'Criar Debate Ágora'
  | 'Sala do Debate Ágora'
  | 'Meu Perfil'
  | (string & {})

/**
 * Registra um evento de acesso (login ou visita a uma área) para o usuário
 * autenticado atual. Não faz nada (e não loga erro) quando não há sessão
 * válida — isso evita os 400 "Failed to create record" dos usuários
 * deslogados. Falhas reais de rede/validação também são ignoradas: o
 * tracking nunca pode impactar a UX nem poluir os logs do backend.
 */
export async function trackAccess(
  area: AccessArea,
  eventType: 'login' | 'page_view' = 'page_view',
  meta?: Record<string, unknown>,
) {
  try {
    const { default: pb } = await import('@/lib/pocketbase/client')
    const user = pb.authStore.record
    if (!user || !user.id) return
    // Requer sessão realmente válida (authStore pode estar "carregado" com
    // um token expirado/inválido após logout ou revalidação falha).
    const authValid = await pb
      .collection('users')
      .authRefresh()
      .then(
        () => true,
        () => false,
      )
    if (!authValid) return
    await pb.collection('access_events').create<AccessEvent>({
      user: user.id,
      area,
      event_type: eventType,
      meta: meta ?? {},
    })
  } catch (e) {
    // no-op: tracking must never break the UX nor pollute backend logs
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
