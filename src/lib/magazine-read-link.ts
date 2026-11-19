// ROTA PROTEGIDA DE LEITURA DA REVISTA — cliente do endpoint
// GET /backend/v1/magazine-read-link?magazine=<id> (pb_hooks/magazine_read_link.js).
// Os leitores NUNCA decidem o acesso pelos campos fliphtml5_link/embed_code da
// listagem (a guarda do servidor os esconde de quem não tem direito): buscam
// sempre aqui. O servidor aplica a regra (Prata/Ouro ativo, admin, compra
// 'paid' da edição, ou is_free/amostra) e devolve { access, link, embed_code }.
import pb from '@/lib/pocketbase/client'

export interface MagazineReadLink {
  access: boolean
  link: string
  embed_code: string
  embed_src: string
  is_free: boolean
}

// Cache por revista + usuário: evita reconsultar a rota protegida ao alternar
// entre edições no leitor. Limpo no logout (mesma estratégia do pricing).
let cache = new Map<string, { data: MagazineReadLink; at: number }>()
const CACHE_MS = 120_000

export function clearMagazineReadLinkCache() {
  cache = new Map()
}

export async function fetchMagazineReadLink(magazineId: string): Promise<MagazineReadLink> {
  const key = `${pb.authStore.model?.id || 'anon'}:${magazineId}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data
  const res = await pb.send<Partial<MagazineReadLink>>(
    `/backend/v1/magazine-read-link?magazine=${encodeURIComponent(magazineId)}`,
    { method: 'GET' },
  )
  const data: MagazineReadLink = {
    access: !!res?.access,
    link: String(res?.link || ''),
    embed_code: String(res?.embed_code || ''),
    embed_src: String(res?.embed_src || ''),
    is_free: !!res?.is_free,
  }
  cache.set(key, { data, at: Date.now() })
  return data
}
