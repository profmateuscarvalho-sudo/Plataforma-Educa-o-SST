import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getMagazines } from '@/services/magazines'
import { Magazine } from '@/types'
import { formatMagazineTitle } from '@/lib/magazine-utils'

/**
 * Faixa superior editorial da Revista do Mês.
 * Fundo --deep (#173F33), texto --deep-foreground (#F4F1E8).
 * Não é fixa: rola junto com a página.
 */
export function MagazineTopBar() {
  const [magazine, setMagazine] = useState<Magazine | null>(null)
  const { i18n } = useTranslation()

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'pt-BR'

  useEffect(() => {
    let cancelled = false
    getMagazines({ language: currentLang })
      .then((mags) => {
        if (cancelled) return
        const featured = mags.find((m) => m.is_featured) || mags[0]
        setMagazine(featured || null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [currentLang])

  if (!magazine) return null

  return (
    <aside
      aria-label="Revista do Mês"
      className="w-full bg-deep text-deep-foreground text-[13px] md:text-[14px] py-2.5 px-4 transition-colors"
    >
      <div className="container mx-auto flex items-center justify-center gap-2 md:gap-3 flex-wrap text-center">
        <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.14em] text-[11px] md:text-[12px] text-primary">
          <BookOpen className="w-3.5 h-3.5" />
          Revista do Mês:
        </span>
        <span className="font-medium text-deep-foreground/90 max-w-md truncate">
          {formatMagazineTitle(magazine.title)}
        </span>
        <Link
          to={`/revistas?revista=${magazine.id}`}
          className="editorial-link font-bold text-primary hover:text-primary transition-colors text-[13px] md:text-[14px] inline-flex items-center gap-1 ml-1"
        >
          Ler grátis
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  )
}
