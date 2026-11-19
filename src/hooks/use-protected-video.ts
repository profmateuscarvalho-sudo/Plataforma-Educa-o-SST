// HOOK CENTRAL DE VÍDEO PROTEGIDO — única porta de entrada do link de vídeo
// fora do admin. Toda tela que renderiza player (aula, live, documentário)
// usa este hook: ele busca o link SEMPRE pela rota protegida do servidor
// (GET /backend/v1/video-link, via fetchProtectedVideoLink) ao abrir o player,
// e NUNCA lê os campos panda_video_id/youtube_url do registro da listagem
// (a guarda do servidor os esconde de quem não tem direito).
// Nenhuma tela nova deve voltar a ler o campo direto — use este hook.
import { useCallback, useEffect, useState } from 'react'
import {
  fetchProtectedVideoLink,
  type ProtectedVideoLink,
  type ProtectedVideoType,
} from '@/lib/video-link'

const SEM_ACESSO: ProtectedVideoLink = { access: false, video_id: '', url: '' }

export interface UseProtectedVideo {
  /** Resultado da rota protegida (null enquanto não carregou). */
  video: ProtectedVideoLink | null
  /** true durante a busca na rota protegida. */
  loading: boolean
  /** Servidor confirmou acesso E há URL de embed para renderizar. */
  unlocked: boolean
  /** Estado final: bloqueado (mostrar cadeado + CTA "Disponível no plano Prata"). */
  locked: boolean
  /** Busca o link (usado ao abrir o player). */
  load: (id: string, type?: ProtectedVideoType) => void
  /** Revalida no servidor (bypass do cache local). */
  refetch: () => void
  /** Limpa o estado local e o cache (usado ao fechar o player). */
  reset: () => void
}

export function useProtectedVideo(
  activeId: string | null | undefined,
  type: ProtectedVideoType = 'lesson',
): UseProtectedVideo {
  const [video, setVideo] = useState<ProtectedVideoLink | null>(null)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState<{ id: string; type: ProtectedVideoType } | null>(null)

  const load = useCallback((id: string, t?: ProtectedVideoType) => {
    setActive({ id, type: t || type })
  }, [type])

  // Busca na rota protegida sempre que o alvo muda. try/catch/finally: o
  // loading SEMPRE termina (mesmo em erro de rede).
  useEffect(() => {
    if (!active) {
      setVideo(null)
      setLoading(false)
      return
    }
    let vivo = true
    setLoading(true)
    fetchProtectedVideoLink(active.type, active.id)
      .then((data) => {
        if (vivo) setVideo(data)
      })
      .catch(() => {
        if (vivo) setVideo(SEM_ACESSO)
      })
      .finally(() => {
        if (vivo) setLoading(false)
      })
    return () => {
      vivo = false
    }
  }, [active])

  const refetch = useCallback(() => {
    if (!active) return
    clearProtectedVideoCache()
    setLoading(true)
    fetchProtectedVideoLink(active.type, active.id)
      .then(setVideo)
      .catch(() => setVideo(SEM_ACESSO))
      .finally(() => setLoading(false))
  }, [active])

  const reset = useCallback(() => {
    setActive(null)
    setVideo(null)
    setLoading(false)
  }, [])

  const unlocked = !!video?.access && !!video.url
  const locked = !loading && !!active && !unlocked

  return { video, loading, unlocked, locked, load, refetch, reset }
}
