import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useSearchParams, Link } from 'react-router-dom'
import { BookOpen, BookX, ImageOff, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getMagazines } from '@/services/magazines'
import { Magazine } from '@/types'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { setMetaTags } from '@/lib/utils'
import { PUBLIC_URL, getSharePreviewUrl } from '@/lib/constants'
import { AppLanguage } from '@/i18n'
import { PageHeader } from '@/components/PageHeader'

// Extrai o ano da revista a partir da data de criação/atualização ou do título (ex: "2026", "2025", "2024")
function getMagazineYear(mag: Magazine): number {
  if (mag.created) {
    const yr = new Date(mag.created).getFullYear()
    if (!isNaN(yr) && yr >= 2020) return yr
  }
  const match = mag.title.match(/20\d{2}/)
  if (match) return parseInt(match[0], 10)
  return 2025
}

// Extrai número da revista (ex: "Revista nº 32" -> "Edição nº 32")
function getMagazineIssueNumber(mag: Magazine): string {
  const match = mag.title.match(/n[ºo°]?\s*(\d+)/i)
  return match ? `Edição nº ${match[1]}` : mag.title
}

// Extrai mês ou data formatada
function getMagazineMonth(mag: Magazine): string {
  if (mag.created) {
    try {
      const d = new Date(mag.created)
      return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    } catch {
      return ''
    }
  }
  return ''
}

export default function Revistas() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [loading, setLoading] = useState(true)
  const [activeReaderMag, setActiveReaderMag] = useState<Magazine | null>(null)

  // Idioma ativo
  const currentLang: AppLanguage = i18n.language?.startsWith('es') ? 'es' : 'pt-BR'

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getMagazines({ language: currentLang })
      setMagazines(data)
    } catch (err) {
      console.error('Error fetching magazines:', err)
    } finally {
      setLoading(false)
    }
  }, [currentLang])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('magazines', () => {
    loadData()
  })

  // Sincroniza revista aberta com query param ?revista=id
  useEffect(() => {
    const revistaId = searchParams.get('revista')
    if (revistaId && magazines.length > 0) {
      const found = magazines.find((m) => m.id === revistaId)
      if (found) {
        setActiveReaderMag(found)
        const imgUrl = found.thumbnail
          ? `${PUBLIC_URL}/api/files/${found.collectionId}/${found.id}/${found.thumbnail}`
          : 'https://img.usecurling.com/p/1200/630?q=magazine%20cover&color=blue'
        const shareUrl = getSharePreviewUrl('revistas', found.id)
        setMetaTags({
          title: `${found.title} | Educação SST`,
          description: found.summary || 'Confira esta edição da Revista SST.',
          image: imgUrl,
          url: shareUrl,
        })
        return
      }
    }
    setActiveReaderMag(null)
    setMetaTags({
      title: t('revistas.pageTitle', 'Revistas Digitais | Educação SST'),
      description: t(
        'revistas.metaDescription',
        'Todo mês, uma edição completa com artigos científicos e boas práticas de SST.',
      ),
      url: window.location.href,
    })
  }, [searchParams, magazines, t])

  const openMagazineReader = (mag: Magazine) => {
    setActiveReaderMag(mag)
    setSearchParams({ revista: mag.id }, { replace: true })
  }

  const closeMagazineReader = () => {
    setActiveReaderMag(null)
    setSearchParams({}, { replace: true })
  }

  // Edição mais recente em destaque
  const latestMag = useMemo(() => {
    if (magazines.length === 0) return null
    return magazines.find((m) => m.is_featured) || magazines[0]
  }, [magazines])

  // Agrupamento por ano para o acervo (2026, 2025, 2024...)
  const archiveByYear = useMemo(() => {
    const groups: Record<number, Magazine[]> = {}
    magazines.forEach((mag) => {
      const year = getMagazineYear(mag)
      if (!groups[year]) groups[year] = []
      groups[year].push(mag)
    })
    // Ordena os anos de forma decrescente
    const sortedYears = Object.keys(groups)
      .map(Number)
      .sort((a, b) => b - a)

    return sortedYears.map((year) => ({
      year,
      magazines: groups[year],
    }))
  }, [magazines])

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C1B18] pb-24">
      {/* Cabeçalho interno padronizado */}
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-2">
            <span className="label-overline">{t('nav.magazines', 'Revistas Digitais')}</span>
            <span className="text-xs text-[#7F7869]">
              · {currentLang === 'es' ? 'Edición en Español' : 'Edição em Português'}
            </span>
          </span>
        }
        title={t('revistas.title', 'Revista Educação SST')}
        description={t(
          'revistas.subtitle',
          'Todo mês, uma edição para pensar a segurança e saúde no trabalho com mais profundidade.',
        )}
      />

      {loading ? (
        <div className="max-w-[1200px] mx-auto px-6 py-12 space-y-12">
          <Skeleton className="w-full h-80 rounded-[28px] bg-[#E4DED1]/60" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-[28px] bg-[#E4DED1]/60" />
            ))}
          </div>
        </div>
      ) : magazines.length === 0 ? (
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="max-w-xl mx-auto flex flex-col items-center justify-center p-12 text-center bg-white rounded-[28px] border border-[#E4DED1] shadow-[0_16px_36px_rgba(28,27,24,0.06)]">
            <div className="w-20 h-20 bg-[#FAF8F3] border border-[#E4DED1] rounded-full flex items-center justify-center mb-6">
              <BookX className="w-10 h-10 text-[#7F7869]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#1C1B18] mb-3">
              {t('revistas.noneTitle', 'Nenhuma edição disponível')}
            </h2>
            <p className="text-base text-[#5F5A4F] leading-relaxed mb-6">
              {t(
                'revistas.noneBody',
                'Não encontramos edições publicadas neste idioma no momento. Volte em breve!',
              )}
            </p>
            <Button
              asChild
              className="rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] px-6 h-11"
            >
              <Link to="/">{t('common.backToHome', 'Voltar ao início')}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-16 sm:space-y-20">
          {/* =========================================================================
              DESTAQUE: Edição mais recente sobre faixa --deep (#173F33)
              Capa grande à esquerda, número, mês e botão primário "Ler edição" à direita
              ========================================================================= */}
          {latestMag && (
            <section className="bg-[#173F33] text-[#F4F1E8] py-12 sm:py-16 shadow-[0_24px_50px_rgba(23,63,51,0.25)]">
              <div className="max-w-[1200px] mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {/* Capa grande à esquerda */}
                  <div className="md:col-span-5 flex justify-center md:justify-start">
                    <div
                      onClick={() => openMagazineReader(latestMag)}
                      className="cursor-pointer group relative w-[240px] sm:w-[280px] lg:w-[320px] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.55)] border border-white/15 bg-[#122e26] transition-transform duration-500 hover:scale-105"
                    >
                      {latestMag.thumbnail ? (
                        <img
                          src={pb.files.getUrl(latestMag, latestMag.thumbnail)}
                          alt={latestMag.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#F4F1E8] bg-[#122e26]">
                          <BookOpen className="w-14 h-14 text-[#FDBE2D] mb-3" />
                          <span className="font-serif font-bold text-lg">Revista Educação SST</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FDBE2D] text-[#1C1B18] font-bold text-sm shadow-lg">
                          <BookOpen className="w-4 h-4" />
                          Abrir edição
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Número, mês e botão primário "Ler edição" à direita */}
                  <div className="md:col-span-7 space-y-6">
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-[#FDBE2D] border border-white/15">
                        <span className="w-2 h-2 rounded-full bg-[#FDBE2D]" />
                        Edição Mais Recente
                      </span>

                      <div className="text-sm sm:text-base font-semibold text-[#FDBE2D] tracking-wide uppercase pt-1">
                        {getMagazineIssueNumber(latestMag)}
                        {getMagazineMonth(latestMag) && (
                          <span className="text-[#F4F1E8]/70">
                            {' '}
                            &middot; {getMagazineMonth(latestMag)}
                          </span>
                        )}
                      </div>

                      <h2 className="title-h2-fluid text-[#F4F1E8] font-serif font-semibold leading-tight">
                        {latestMag.title}
                      </h2>
                    </div>

                    <p className="text-base sm:text-lg text-[#F4F1E8]/85 leading-relaxed font-normal max-w-xl">
                      {latestMag.summary ||
                        'Acesse os artigos em destaque, entrevistas com especialistas e os principais debates técnicos do setor nesta edição.'}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
                      <Button
                        size="lg"
                        className="h-12 px-8 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none text-base"
                        onClick={() => openMagazineReader(latestMag)}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Ler edição
                      </Button>

                      <Link
                        to="/submeter-artigo"
                        className="editorial-link text-sm sm:text-base font-semibold text-[#F4F1E8] hover:text-[#FDBE2D]"
                      >
                        Submeter artigo para a Revista &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================================
              ACERVO DA REVISTA AGRUPADO POR ANO (2026, 2025, 2024...)
              Título em Playfair + grade de capas.
              No hover a capa sobe 4px e aparece "Ler edição →"
              ========================================================================= */}
          <section className="max-w-[1200px] mx-auto px-6 space-y-12">
            <div>
              <span className="label-overline">MEMÓRIA EDITORIAL</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1C1B18] mt-1">
                Acervo da Revista
              </h2>
              <p className="text-base sm:text-lg text-[#5F5A4F] mt-2">
                Navegue pelas edições anteriores publicadas pela nossa equipe editorial.
              </p>
            </div>

            <div className="space-y-14">
              {archiveByYear.map(({ year, magazines: yearMags }) => (
                <div key={year} className="space-y-6 border-t border-[#E4DED1] pt-8">
                  {/* Título do Ano em Playfair */}
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1B18] tracking-tight">
                      {year}
                    </h3>
                    <span className="text-sm font-semibold text-[#7F7869]">
                      {yearMags.length} {yearMags.length === 1 ? 'edição' : 'edições'}
                    </span>
                  </div>

                  {/* Grade de Capas (cartões 28px no padrão novo) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                    {yearMags.map((mag) => {
                      const imgUrl = mag.thumbnail ? pb.files.getUrl(mag, mag.thumbnail) : null

                      return (
                        <div
                          key={mag.id}
                          onClick={() => openMagazineReader(mag)}
                          className="group cursor-pointer rounded-[28px] bg-white border border-[#E4DED1] overflow-hidden p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(28,27,24,0.1)]"
                        >
                          {/* Capa */}
                          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#FAF8F3] border border-[#E4DED1] mb-4 shrink-0 flex items-center justify-center">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={mag.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-[#7F7869] p-4 text-center">
                                <ImageOff className="w-10 h-10 mb-2 opacity-50" />
                                <span className="text-xs font-medium">Capa indisponível</span>
                              </div>
                            )}

                            {/* Overlay hover suave */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDBE2D] text-[#1C1B18] font-bold text-xs shadow-md">
                                Ler edição &rarr;
                              </span>
                            </div>
                          </div>

                          {/* Informações da revista */}
                          <div className="space-y-2 flex-grow flex flex-col justify-between">
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7F7869] block mb-1">
                                {getMagazineIssueNumber(mag)}
                              </span>
                              <h4 className="font-serif font-semibold text-base sm:text-lg text-[#1C1B18] leading-tight line-clamp-2 group-hover:text-[#173F33] transition-colors">
                                {mag.title}
                              </h4>
                            </div>

                            <div className="pt-3 border-t border-[#E4DED1] flex items-center justify-between text-xs font-semibold text-[#1C1B18] group-hover:text-[#173F33]">
                              <span>Ler edição</span>
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Leitor da Revista (Dialog / FlipHTML5 ou Embed) */}
      <Dialog open={!!activeReaderMag} onOpenChange={(open) => !open && closeMagazineReader()}>
        <DialogContent className="max-w-6xl w-[95vw] h-[88vh] p-0 overflow-hidden bg-black/10 border-none rounded-[28px]">
          <DialogTitle className="sr-only">{activeReaderMag?.title}</DialogTitle>
          {activeReaderMag &&
            (activeReaderMag.embed_code ? (
              <div
                className="w-full h-full bg-white [&>iframe]:w-full [&>iframe]:h-full"
                dangerouslySetInnerHTML={{ __html: activeReaderMag.embed_code }}
              />
            ) : (
              <iframe
                src={activeReaderMag.fliphtml5_link}
                className="w-full h-full border-none rounded-[28px] bg-white"
                allowFullScreen
                scrolling="no"
                title={activeReaderMag.title}
              />
            ))}
        </DialogContent>
      </Dialog>
    </div>
  )
}
