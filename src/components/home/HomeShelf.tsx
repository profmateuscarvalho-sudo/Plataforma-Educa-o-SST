import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HomeShelfProps {
  title: string
  /** Link "Ver todos": omitir quando não existe listagem pública da área. */
  moreTo?: string
  moreLabel?: string
  children: React.ReactNode
}

/**
 * Prateleira deslizante controlada pelo usuário: arrasto no celular (scroll
 * nativo por toque) e setas no computador. Nenhuma rolagem ou slide automático.
 * No desktop também é possível arrastar com o mouse.
 */
export function HomeShelf({ title, moreTo, moreLabel = 'Ver todos', children }: HomeShelfProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const dragState = useRef<{ startX: number; startLeft: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const updateArrows = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [updateArrows, children])

  const scrollByPage = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  // Arrasto com o mouse no desktop (o toque já rola nativamente)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    dragState.current = { startX: e.clientX, startLeft: el.scrollLeft, moved: false }
    el.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragState.current
    const el = ref.current
    if (!d || !el) return
    const dx = e.clientX - d.startX
    if (Math.abs(dx) > 4) d.moved = true
    el.scrollLeft = d.startLeft - dx
  }
  const endDrag = () => {
    if (dragState.current?.moved) suppressClick.current = true
    dragState.current = null
  }
  // Um arrasto não pode terminar em clique no card
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClick.current = false
    }
  }

  return (
    <section aria-label={title} className="mb-12 sm:mb-16">
      <div className="flex items-end justify-between gap-4 mb-4 sm:mb-5">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        {moreTo && (
          <Link
            to={moreTo}
            className="editorial-link text-sm sm:text-base font-semibold text-foreground hover:text-[#173F33] dark:hover:text-[#FDBE2D] shrink-0"
          >
            {moreLabel} &rarr;
          </Link>
        )}
      </div>

      <div className="relative">
        {/* Setas — apenas no computador */}
        <button
          type="button"
          aria-label={`${title}: rolar para a esquerda`}
          onClick={() => scrollByPage(-1)}
          disabled={!canLeft}
          className={`hidden md:flex absolute -left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-md text-foreground transition-opacity hover:border-[#FDBE2D]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            canLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label={`${title}: rolar para a direita`}
          onClick={() => scrollByPage(1)}
          disabled={!canRight}
          className={`hidden md:flex absolute -right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-md text-foreground transition-opacity hover:border-[#FDBE2D]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            canRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div
          ref={ref}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-proximity pb-2 -mx-6 px-6 sm:mx-0 sm:px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing motion-reduce:cursor-default"
        >
          {children}
        </div>
      </div>
    </section>
  )
}
