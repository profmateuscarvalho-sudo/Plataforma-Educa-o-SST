// Mídia do hero da Home (vídeo da revista sendo folheada + poster + páginas).
// Fonte da verdade: GET /backend/v1/magazine-pricing (público, sem auth), o
// mesmo endpoint dos preços da venda avulsa — os arquivos são persistidos no
// registro único de magazine_landing_page pelo admin (Revistas → Configurações).
// O endpoint devolve apenas NOMES de arquivo + o id do registro; a URL completa
// é determinística: {base}/api/files/{coleção}/{id}/{arquivo}.
import pb from '@/lib/pocketbase/client'

export interface MagazineHomeMedia {
  /** URL do vídeo .mp4 do hero, ou null quando não há vídeo cadastrado. */
  videoUrl: string | null
  /** URL do poster (.jpg) do vídeo, ou null. */
  posterUrl: string | null
  /** Nº de páginas da edição do mês (0 = não informado). */
  pages: number
}

let cache: { data: MagazineHomeMedia; at: number } | null = null
const CACHE_MS = 60_000

export async function fetchMagazineHomeMedia(): Promise<MagazineHomeMedia> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data

  const res = (await pb.send('/backend/v1/magazine-pricing', { method: 'GET' })) as {
    home_video?: string
    home_video_poster?: string
    current_issue_pages?: number
    media_record_id?: string
  }

  const nomeVideo = String(res?.home_video || '')
  const nomePoster = String(res?.home_video_poster || '')
  const recordId = String(res?.media_record_id || '')
  const pages = Number(res?.current_issue_pages) > 0 ? Number(res.current_issue_pages) : 0

  // A URL é determinística: /api/files/{coleção}/{id}/{arquivo}. Sem id de
  // registro (ex.: base nova ainda sem a semente), não há como montá-la.
  const base = (pb.buildUrl ? pb.buildUrl('') : pb.baseUrl).replace(/\/$/, '')
  const urlDe = (filename: string) =>
    filename && recordId
      ? `${base}/api/files/magazine_landing_page/${recordId}/${encodeURIComponent(filename)}`
      : null

  const data: MagazineHomeMedia = {
    videoUrl: urlDe(nomeVideo),
    posterUrl: urlDe(nomePoster),
    pages,
  }
  cache = { data, at: Date.now() }
  return data
}

export function clearMagazineHomeMediaCache() {
  cache = null
}
