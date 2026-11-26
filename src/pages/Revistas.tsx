import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom'
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
import { LockedBadge, LockedCta, LockedOverlay } from '@/components/LockedBadge'
import { useStudentAccess } from '@/hooks/use-student-access'
import { useAuth } from '@/hooks/use-auth'
import { usePurchasedMagazines, isMagazinePurchased } from '@/hooks/use-purchased-magazines'
import { useMagazineReadLink } from '@/hooks/use-magazine-read-link'
import { MagazineBuyButton } from '@/components/magazine/MagazineBuyButton'
import { MagazineReaderFrame } from '@/components/magazine/MagazineReaderFrame'
import { CheckoutModal } from '@/components/CheckoutModal'
import {
  getMagazineCardKicker,
  getMagazineCardTitle,
  pickLatestMagazine,
} from '@/lib/magazine-utils'

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

export default function Revistas() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [loading, setLoading] = useState(true)
  const [activeReaderMag, setActiveReaderMag] = useState<Magazine | null>(null)
  // Link de leitura SEMPRE vem da rota protegida do servidor (via
  // useMagazineReadLink) — nunca dos campos da listagem (a guarda esconde
  // fliphtml5_link/embed_code de quem não tem direito).
  const {
    readLink,
    loading: readLinkLoading,
    refetch: refetchReadLink,
    reset: resetReadLink,
  } = useMagazineReadLink(activeReaderMag?.id || null)
  const [checkoutMagId, setCheckoutMagId] = useState<string | null>(null)
  const [checkoutMagIdInReader, setCheckoutMagIdInReader] = useState<string | null>(null)
  const [purchasedRefresh, setPurchasedRefresh] = useState(0)
  const { user } = useAuth()
  // Revista virou conteúdo de assinante (Prata/Ouro). O catálogo (capa, título,
  // edição) continua público; a leitura exige plano OU compra avulsa da edição.
  const { canAccessMagazine, loading: accessLoading } = useStudentAccess()
  const { purchased } = usePurchasedMagazines(user?.id, purchasedRefresh)

  const hasFullAccess = !accessLoading && canAccessMagazine()
  const isUnlocked = useCallback(
    (mag: Magazine) => hasFullAccess || isMagazinePurchased(purchased, mag.id),
    [hasFullAccess, purchased],
  )
  // Bloqueio por edição (função). Enquanto o acesso carrega, trata como liberada
  // para não renderizar estado bloqueado por engano.
  const magLocked = useCallback(
    (mag: Magazine) => !accessLoading && !isUnlocked(mag),
    [accessLoading, isUnlocked],
  )

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

  // Revalidação silenciosa (sem skeleton): usada após pagamento confirmado para
  // buscar os links de leitura liberados pelo access_guard sem recarregar a página.
  const refetchData = useCallback(async () => {
    try {
      const data = await getMagazines({ language: currentLang })
      setMagazines(data)
    } catch {
      // mantém a lista atual em caso de erro transitório
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

  const openMagazineReader = useCallback(
    (mag: Magazine) => {
      // Leitura exige Prata/Ouro OU compra avulsa desta edição
      if (magLocked(mag)) return
      setActiveReaderMag(mag)
      setSearchParams({ revista: mag.id }, { replace: true })
    },
    [magLocked, setSearchParams],
  )

  // Compra avulsa: visitante vai ao login e volta para esta URL; logado abre o
  // checkout com magazineId (preço exibido do servidor, cobrado pelo backend).
  const handleBuy = useCallback(
    (buyMagId: string) => {
      if (!user) {
        const target = `${location.pathname}${location.search}`
        navigate(`/login?redirect=${encodeURIComponent(target)}`)
        return
      }
      setCheckoutMagId(buyMagId)
    },
    [user, location.pathname, location.search, navigate],
  )

  // Pagamento confirmado: revalida "minhas revistas" e o catálogo (o access_guard
  // passa a devolver o link desta edição) — liberação sem recarregar a página.
  const handlePaid = useCallback(() => {
    setPurchasedRefresh((k) => k + 1)
    refetchData()
  }, [refetchData])

  // Após a liberação, o access_guard passa a devolver o link de leitura desta
  // edição — sincroniza a edição aberta no Dialog com a lista revalidada.
  useEffect(() => {
    if (!activeReaderMag) return
    const fresh = magazines.find((m) => m.id === activeReaderMag.id)
    if (fresh && fresh !== activeReaderMag) setActiveReaderMag(fresh)
  }, [magazines, activeReaderMag])

  // Pagamento confirmado dentro do leitor: revalida a rota protegida (o
  // servidor passa a liberar o link desta edição) sem fechar o Dialog.
  const handlePaidInReader = useCallback(() => {
    setPurchasedRefresh((k) => k + 1)
    refetchReadLink()
  }, [refetchReadLink])

  const closeMagazineReader = () => {
    setActiveReaderMag(null)
    resetReadLink()
    setSearchParams({}, { replace: true })
  }

  // Edição mais recente em destaque
  const latestMag = useMemo(() => {
    if (magazines.length === 0) return null
    return pickLatestMagazine(magazines)
  }, [magazines])
  const latestMagLocked = latestMag ? magLocked(latestMag) : false

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
                      className={`group relative w-[240px] sm:w-[280px] lg:w-[320px] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.55)] border border-white/15 bg-[#122e26] transition-transform duration-500 ${latestMagLocked ? '' : 'cursor-pointer hover:scale-105'}`}
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
                      {/* Overlay "Abrir edição" só quando há acesso; bloqueada fica só a capa */}
                      {!latestMagLocked && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FDBE2D] text-[#1C1B18] font-bold text-sm shadow-lg">
                            <BookOpen className="w-4 h-4" />
                            Abrir edição
                          </span>
                        </div>
                      )}
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
                        {getMagazineCardKicker(latestMag, true)}
                      </div>

                      <h2 className="title-h2-fluid text-[#F4F1E8] font-serif font-semibold leading-tight">
                        {getMagazineCardTitle(latestMag, true)}
                      </h2>
                    </div>

                    <p className="text-base sm:text-lg text-[#F4F1E8]/85 leading-relaxed font-normal max-w-xl">
                      {latestMag.summary ||
                        'Acesse os artigos em destaque, entrevistas com especialistas e os principais debates técnicos do setor nesta edição.'}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
                      {latestMagLocked ? (
                        <MagazineBuyButton
                          magazineId={latestMag.id}
                          onBuy={handleBuy}
                          className="w-full max-w-xs [&>p]:text-[#F4F1E8]/70 [&>p>a]:text-[#FDBE2D]"
                        />
                      ) : (
                        <Button
                          size="lg"
                          className="h-12 px-8 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none text-base"
                          onClick={() => openMagazineReader(latestMag)}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Ler edição
                        </Button>
                      )}

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
                      const locked = magLocked(mag)
                      const isLatest = mag.id === latestMag?.id

                      return (
                        <div
                          key={mag.id}
                          onClick={() => openMagazineReader(mag)}
                          className={`group rounded-[28px] bg-white border border-[#E4DED1] overflow-hidden p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 ${locked ? '' : 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(28,27,24,0.1)]'}`}
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

                            {/* Overlay: hover suave quando liberada / cadeado quando bloqueada */}
                            {locked ? (
                              <LockedOverlay className="rounded-none" />
                            ) : (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDBE2D] text-[#1C1B18] font-bold text-xs shadow-md">
                                  Ler edição &rarr;
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Informações da revista */}
                          <div className="space-y-2 flex-grow flex flex-col justify-between">
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7F7869] block mb-1">
                                {getMagazineCardKicker(mag, isLatest)}
                              </span>
                              <h4 className="font-serif font-semibold text-base sm:text-lg text-[#1C1B18] leading-tight line-clamp-2 group-hover:text-[#173F33] transition-colors">
                                {getMagazineCardTitle(mag, isLatest)}
                              </h4>
                            </div>

                            {/* Ações: bloqueada → compra avulsa + linha "ou assine o Prata";
                                liberada (assinante ou comprou) → "Ler edição" */}
                            <div className="pt-3 border-t border-[#E4DED1]">
                              {locked ? (
                                <MagazineBuyButton
                                  magazineId={mag.id}
                                  onBuy={handleBuy}
                                  variant="compact"
                                />
                              ) : (
                                <div className="flex items-center justify-between text-xs font-semibold text-[#1C1B18] group-hover:text-[#173F33]">
                                  <span>Ler edição</span>
                                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                                </div>
                              )}
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
            (readLinkLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-[#122e26] text-[#F4F1E8]/80 text-sm font-medium">
                Carregando revista...
              </div>
            ) : !readLink?.access ||
              (!readLink.link && !readLink.embed_code && !readLink.embed_src) ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#122e26] p-8 text-center">
                <LockedBadge />
                <p className="text-[#F4F1E8] text-sm sm:text-base max-w-md">
                  A leitura completa desta edição faz parte do plano Prata — ou compre esta edição
                  avulsa.
                </p>
                <MagazineBuyButton
                  magazineId={activeReaderMag.id}
                  onBuy={setCheckoutMagIdInReader}
                  className="w-full max-w-xs [&>p]:text-[#F4F1E8]/70 [&>p>a]:text-[#FDBE2D]"
                />
                <LockedCta label="Assine" className="h-11 px-6 rounded-full font-bold text-sm" />
              </div>
            ) : (
              <MagazineReaderFrame
                title={activeReaderMag.title}
                embedCode={readLink.embed_code}
                src={readLink.embed_src || readLink.link}
                containerClassName="w-full h-full rounded-[28px] bg-white"
              />
            ))}
        </DialogContent>
      </Dialog>

      {/* Checkout da compra avulsa (Pix sem desconto / cartão). Ao confirmar,
          handlePaid revalida o acesso e a edição abre no mesmo Dialog sem reload. */}
      <CheckoutModal
        open={!!checkoutMagId}
        setOpen={(v) => !v && setCheckoutMagId(null)}
        title="Revista Educação SST — edição avulsa"
        magazineId={checkoutMagId || undefined}
        onPaid={handlePaid}
      />
      {/* Checkout aberto de dentro do leitor (estado bloqueado na rota protegida) */}
      <CheckoutModal
        open={!!checkoutMagIdInReader}
        setOpen={(v) => !v && setCheckoutMagIdInReader(null)}
        title="Revista Educação SST — edição avulsa"
        magazineId={checkoutMagIdInReader || undefined}
        onPaid={handlePaidInReader}
      />
    </div>
  )
}
