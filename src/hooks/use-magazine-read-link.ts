// HOOK CENTRAL DO LINK DE LEITURA DA REVISTA — única porta de entrada do link
// de leitura fora do admin. Toda tela que abre uma revista usa este hook: ele
// busca o link SEMPRE pela rota protegida do servidor (GET /backend/v1/
// magazine-read-link, via fetchMagazineReadLink) e NUNCA lê os campos
// fliphtml5_link/embed_code do registro da listagem (a guarda do servidor os
// esconde de quem não tem direito, e eles nem sempre vêm preenchidos).
// Nenhuma tela nova deve voltar a ler o campo direto — use este hook.
import { useCallback, useEffect, useState } from 'react'
import {
  fetchMagazineReadLink,
  clearMagazineReadLinkCache,
  type MagazineReadLink,
} from '@/lib/magazine-read-link'

const SEM_ACESSO: MagazineReadLink = {
  access: false,
  link: '',
  embed_code: '',
  embed_src: '',
  is_free: false,
}

export interface UseMagazineReadLink {
  /** Resultado da rota protegida (null enquanto não carregou). */
  readLink: MagazineReadLink | null
  /** true durante a busca na rota protegida. */
  loading: boolean
  /** Servidor confirmou acesso E há link/embed para renderizar. */
  unlocked: boolean
  /** Estado final: bloqueado (mostrar cadeado + MagazineBuyButton). */
  locked: boolean
  /** Busca o link da edição (usado ao abrir o leitor). */
  load: (magazineId: string) => void
  /** Revalida a edição atual (usado após pagamento confirmado). */
  refetch: () => void
  /** Limpa o estado local e o cache (usado ao fechar o leitor). */
  reset: () => void
}

export function useMagazineReadLink(
  activeMagazineId: string | null | undefined,
): UseMagazineReadLink {
  const [readLink, setReadLink] = useState<MagazineReadLink | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(activeMagazineId ?? null)

  const load = useCallback((magazineId: string) => {
    setActiveId(magazineId)
  }, [])

  // Busca na rota protegida sempre que a edição ativa muda.
  useEffect(() => {
    if (!activeId) {
      setReadLink(null)
      setLoading(false)
      return
    }
    let vivo = true
    setLoading(true)
    fetchMagazineReadLink(activeId)
      .then((data) => {
        if (vivo) setReadLink(data)
      })
      .catch(() => {
        if (vivo) setReadLink(SEM_ACESSO)
      })
      .finally(() => {
        if (vivo) setLoading(false)
      })
    return () => {
      vivo = false
    }
  }, [activeId])

  const refetch = useCallback(() => {
    if (!activeId) return
    // Força ida ao servidor (bypass do cache local de 2 min).
    clearMagazineReadLinkCache()
    setLoading(true)
    fetchMagazineReadLink(activeId)
      .then(setReadLink)
      .catch(() => setReadLink(SEM_ACESSO))
      .finally(() => setLoading(false))
  }, [activeId])

  const reset = useCallback(() => {
    setActiveId(null)
    setReadLink(null)
    setLoading(false)
  }, [])

  const unlocked =
    !!readLink?.access && !!(readLink.link || readLink.embed_code || readLink.embed_src)
  const locked = !loading && !!activeId && !unlocked

  return { readLink, loading, unlocked, locked, load, refetch, reset }
}
