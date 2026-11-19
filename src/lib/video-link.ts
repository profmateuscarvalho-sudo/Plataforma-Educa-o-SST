// ROTA PROTEGIDA DE VÍDEO — cliente do endpoint
// GET /backend/v1/video-link?type=lesson|live|documentary&id=<id>
// (pb_hooks/video_link.js). Nenhuma tela decide o player pelos campos
// panda_video_id/youtube_url do registro da listagem (a guarda do servidor os
// esconde de quem não tem direito): busca sempre aqui, ao abrir o player.
// O servidor aplica a mesma matriz do Bloco 3 do access_guard (curso is_free,
// compra 'paid' do curso, tier Prata/Ouro ativo, admin, documentário is_free)
// e devolve { access, video_id, url }.
import pb from '@/lib/pocketbase/client'

export type ProtectedVideoType = 'lesson' | 'live' | 'documentary'

export interface ProtectedVideoLink {
  access: boolean
  video_id: string
  url: string
}

// Cache por usuário + tipo + id: evita reconsultar ao reabrir o mesmo player.
// Limpo no logout (mesma estratégia do pricing/revista).
let cache = new Map<string, { data: ProtectedVideoLink; at: number }>()
const CACHE_MS = 120_000

export function clearProtectedVideoCache() {
  cache = new Map()
}

export async function fetchProtectedVideoLink(
  type: ProtectedVideoType,
  id: string,
): Promise<ProtectedVideoLink> {
  const key = `${pb.authStore.model?.id || 'anon'}:${type}:${id}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data
  const res = await pb.send<Partial<ProtectedVideoLink>>(
    `/backend/v1/video-link?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
    { method: 'GET' },
  )
  const data: ProtectedVideoLink = {
    access: !!res?.access,
    video_id: String(res?.video_id || ''),
    url: String(res?.url || ''),
  }
  cache.set(key, { data, at: Date.now() })
  return data
}
