import pb from '@/lib/pocketbase/client'
import { AgoraDebate, AgoraVoto, AgoraApoio } from '@/types'

export const DEFAULT_REGRAS_CONDUTA =
  '1. Respeite todos os participantes.\n2. Argumente com base técnica e normativa.\n3. Evite ataques pessoais.\n4. Cite fontes sempre que possível.'

export const SUGESTOES_TAGS = [
  'NR-35',
  'NR-12',
  'NR-10',
  'NR-01',
  'NR-15',
  'CIPA',
  'EPI',
  'Ergonomia',
  'Gestão de Risco',
  'Legislação',
  'eSocial',
  'PGR',
  'Higiene Ocupacional',
]

/**
 * Busca a lista de debates da Ágora com ordenação inteligente.
 */
export async function getDebates(filter?: string): Promise<AgoraDebate[]> {
  return pb.collection('agora_debates').getFullList<AgoraDebate>({
    sort: '-created',
    filter: filter || '',
    expand: 'moderador_id',
  })
}

/**
 * Busca um único debate pelo ID com moderador expandido.
 */
export async function getDebateById(id: string): Promise<AgoraDebate> {
  return pb.collection('agora_debates').getOne<AgoraDebate>(id, {
    expand: 'moderador_id',
  })
}

/**
 * Cria um novo debate.
 */
export async function createDebate(
  data: Omit<Partial<AgoraDebate>, 'id' | 'created' | 'updated'>,
): Promise<AgoraDebate> {
  return pb.collection('agora_debates').create<AgoraDebate>(data)
}

/**
 * Atualiza um debate existente (moderador / admin).
 */
export async function updateDebate(id: string, data: Partial<AgoraDebate>): Promise<AgoraDebate> {
  return pb.collection('agora_debates').update<AgoraDebate>(id, data)
}

/**
 * Busca todos os votos de um debate com os dados dos usuários expandidos.
 */
export async function getVotosByDebate(debateId: string): Promise<AgoraVoto[]> {
  return pb.collection('agora_votos').getFullList<AgoraVoto>({
    filter: `debate_id = "${debateId}"`,
    sort: '-apoios,-created',
    expand: 'usuario_id',
  })
}

/**
 * Busca o voto de um usuário específico em um debate.
 */
export async function getUserVoto(debateId: string, userId: string): Promise<AgoraVoto | null> {
  try {
    return await pb
      .collection('agora_votos')
      .getFirstListItem<AgoraVoto>(`debate_id = "${debateId}" && usuario_id = "${userId}"`, {
        expand: 'usuario_id',
      })
  } catch (_) {
    return null
  }
}

/**
 * Registra um novo voto com justificativa (mínimo 50 caracteres).
 * Voto é definitivo e não pode ser editado.
 */
export async function createVoto(data: {
  debate_id: string
  usuario_id: string
  posicao: 'a_favor' | 'contra' | 'complementacao'
  justificativa: string
}): Promise<AgoraVoto> {
  return pb.collection('agora_votos').create<AgoraVoto>({
    ...data,
    apoios: 0,
  })
}

/**
 * Busca os apoios dados pelo usuário nos votos de um debate.
 */
export async function getUserApoiosForVotos(
  votoIds: string[],
  userId: string,
): Promise<Set<string>> {
  if (votoIds.length === 0 || !userId) return new Set()
  try {
    const filter = `usuario_id = "${userId}" && (${votoIds
      .map((id) => `voto_id = "${id}"`)
      .join(' || ')})`
    const apoios = await pb.collection('agora_apoios').getFullList<AgoraApoio>({
      filter,
    })
    return new Set(apoios.map((a) => a.voto_id))
  } catch (_) {
    return new Set()
  }
}

/**
 * Alterna (toggle) o apoio a um argumento.
 */
export async function toggleApoio(votoId: string, userId: string): Promise<boolean> {
  try {
    const existing = await pb
      .collection('agora_apoios')
      .getFirstListItem<AgoraApoio>(`voto_id = "${votoId}" && usuario_id = "${userId}"`)
    await pb.collection('agora_apoios').delete(existing.id)
    return false // removido
  } catch (_) {
    await pb.collection('agora_apoios').create({
      voto_id: votoId,
      usuario_id: userId,
    })
    return true // adicionado
  }
}

/**
 * Monta o link wa.me para compartilhamento do debate.
 */
export function buildWhatsAppShareUrl(
  tema: string,
  dataTerminoIso: string,
  debateId: string,
): string {
  let dataStr = ''
  try {
    const d = new Date(dataTerminoIso)
    dataStr = d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (_) {
    dataStr = dataTerminoIso
  }

  const origin = window.location.origin
  const debateLink = `${origin}/plataforma/agora/${debateId}`
  const text = `🏛️ Novo debate no Hub de Estudos: '${tema}'. Participe até ${dataStr}: ${debateLink}`

  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
