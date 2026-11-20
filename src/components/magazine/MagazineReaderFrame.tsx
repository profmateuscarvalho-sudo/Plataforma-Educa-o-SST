import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void
}

// Safari em iPhone/iPad não permite fullscreen de elementos (nem do iframe):
// nesses dispositivos o botão abre um overlay de tela inteira dentro da
// própria plataforma. iPadOS 13+ se identifica como Macintosh — checar
// navigator.maxTouchPoints para não deixar esses aparelhos de fora.
export function isIosLikeDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const iOSByUa = /iPad|iPhone|iPod/.test(ua)
  const iPadOsAsMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  return iOSByUa || iPadOsAsMac
}

// O embed_code do FlipHTML5 chega pronto do servidor (rota protegida) e pode
// conter um <iframe> sem permissão de fullscreen. Injeta allowfullscreen +
// allow="fullscreen" (mantendo permissões já presentes na lista do allow).
export function withIframeFullscreenPermissions(html: string): string {
  return html.replace(/<iframe\b([^>]*)>/gi, (match: string, attrs: string) => {
    let next = attrs
    if (!/allowfullscreen/i.test(next)) next = `${next} allowfullscreen`
    if (!/\ballow\s*=\s*(["'])(?:(?!\1).)*fullscreen/i.test(next)) {
      const existing = next.match(/\ballow\s*=\s*(["'])(.*?)\1/i)
      if (existing) {
        const current = existing[2].trim().replace(/;?\s*$/, '')
        next = next.replace(
          existing[0],
          `allow="${current ? `${current}; fullscreen` : 'fullscreen'}"`,
        )
      } else {
        next = `${next} allow="fullscreen"`
      }
    }
    return `<iframe${next}>`
  })
}

// Extrai o src do primeiro <iframe> dentro do embed_code do FlipHTML5. O embed
// vem com wrappers internos extras: renderizar o MESMO <iframe> nosso (com o
// src extraído) evita depender de seletores de filho direto para dimensionar.
export function extractIframeSrc(html: string): string {
  const match = html.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i)
  return match?.[1]?.trim() || ''
}

export interface MagazineReaderFrameProps {
  title: string
  /** HTML de embed vindo da rota protegida (readLink.embed_code). */
  embedCode?: string
  /** URL direta vinda da rota protegida (readLink.embed_src || readLink.link). */
  src?: string
  /** Classes do contêiner do leitor (estilo de cada tela). */
  containerClassName?: string
}

/**
 * Leitor de revista com botão "Tela cheia" próprio.
 *
 * - Desktop/Android: requestFullscreen (com prefixo webkit para Safari) sobre o
 *   CONTÊINER do leitor; fullscreenchange (e a variante webkit) mantém o estado
 *   do botão sincronizado — a tecla Esc sai nativamente.
 * - iPhone/iPad (Safari não suporta fullscreen de elementos): abre um overlay
 *   fixed ocupando 100% da viewport (100dvh), sem menu/rodapé do layout, com
 *   botão "X" para fechar. NUNCA abre o link em nova aba (o link da revista não
 *   pode ser exposto).
 *
 * Renderização: SEMPRE o mesmo <iframe> nosso (do src direto da rota protegida
 * ou do src extraído do embed_code). Só injeta o HTML de embed quando ele não
 * tem iframe algum — e força width/height 100% em todos os iframes internos.
 */
export function MagazineReaderFrame({
  title,
  embedCode,
  src,
  containerClassName,
}: MagazineReaderFrameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  // Detecta iOS uma vez por montagem (userAgent não muda durante a sessão).
  const isIosRef = useRef(isIosLikeDevice())

  const embedSrc = embedCode ? extractIframeSrc(embedCode) : ''
  const effectiveSrc = src || embedSrc || ''
  const injectHtml = !effectiveSrc && !!embedCode
  const hasContent = Boolean(effectiveSrc || injectHtml)
  const active = isFullscreen || overlayOpen

  // Fallback do embed injetado: força width/height 100% em TODOS os iframes
  // internos (o embed do FlipHTML5 usa wrappers extras que os seletores de
  // filho direto do CSS não alcançam).
  useEffect(() => {
    if (!injectHtml || !containerRef.current) return
    const iframes = containerRef.current.querySelectorAll('iframe')
    iframes.forEach((f) => {
      f.style.width = '100%'
      f.style.height = '100%'
    })
  }, [injectHtml, embedCode])

  // Sincroniza o estado do botão com o fullscreen real (Esc, F11 etc. incluídos).
  useEffect(() => {
    const sync = () => {
      const doc = document as FullscreenDocument
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  // Overlay: trava o scroll do body e fecha também com Esc (fallback de
  // desktop quando requestFullscreen falha, ex.: preview em iframe).
  useEffect(() => {
    if (!overlayOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOverlayOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [overlayOpen])

  const toggleNativeFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const doc = document as FullscreenDocument
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      if (doc.exitFullscreen) {
        void doc.exitFullscreen().catch(() => {})
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen()
      }
      return
    }
    const target = el as FullscreenElement
    if (target.requestFullscreen) {
      target.requestFullscreen().catch(() => setOverlayOpen(true))
    } else if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen()
    } else {
      setOverlayOpen(true)
    }
  }, [])

  const handleFullscreenButton = useCallback(() => {
    if (!hasContent) return
    if (overlayOpen) {
      setOverlayOpen(false)
      return
    }
    if (isIosRef.current) {
      // Safari iOS: overlay de tela inteira na própria plataforma.
      setOverlayOpen(true)
      return
    }
    toggleNativeFullscreen()
  }, [hasContent, overlayOpen, toggleNativeFullscreen])

  const readerContent = injectHtml ? (
    <div
      className="w-full h-full bg-white [&_iframe]:w-full [&_iframe]:h-full"
      dangerouslySetInnerHTML={{ __html: withIframeFullscreenPermissions(embedCode || '') }}
    />
  ) : effectiveSrc ? (
    <iframe
      src={effectiveSrc}
      title={title}
      className="w-full h-full block bg-white border-none"
      allowFullScreen
      allow="fullscreen"
    />
  ) : null

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          'flex flex-col bg-card overflow-hidden',
          isFullscreen ? 'w-full h-full rounded-none border-0 shadow-none' : containerClassName,
        )}
      >
        {/* Barra do leitor: fica DENTRO do contêiner para continuar visível
            (com "Sair da tela cheia") enquanto o leitor está em fullscreen. */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 shrink-0 bg-card border-b border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFullscreenButton}
            disabled={!hasContent}
            className="rounded-full border-[1.5px] border-foreground/80 text-foreground hover:bg-muted h-9 px-3.5 font-semibold"
          >
            {active ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="ml-1.5">{active ? 'Sair da tela cheia' : 'Tela cheia'}</span>
          </Button>
        </div>

        <div className="flex-1 min-h-0 w-full bg-card">{overlayOpen ? null : readerContent}</div>
      </div>

      {/* Overlay de tela inteira (iPhone/iPad e fallback quando o navegador
          nega requestFullscreen). Renderizado em portal para cobrir o layout
          inteiro — sem menu lateral, sem rodapé. */}
      {overlayOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col bg-black"
            style={{ height: '100dvh' }}
            role="dialog"
            aria-modal="true"
            aria-label={`Tela cheia: ${title}`}
          >
            <div className="flex items-center justify-between gap-3 px-3 py-2 shrink-0">
              <span className="text-white/80 text-xs font-semibold truncate">{title}</span>
              <button
                type="button"
                onClick={() => setOverlayOpen(false)}
                aria-label="Fechar tela cheia"
                className="w-10 h-10 shrink-0 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 w-full bg-white">{readerContent}</div>
          </div>,
          document.body,
        )}
    </>
  )
}
