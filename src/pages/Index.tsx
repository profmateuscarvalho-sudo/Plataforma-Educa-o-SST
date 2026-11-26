import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSubscriptionPlans } from '@/hooks/use-subscription-plans'
import { getMagazines } from '@/services/magazines'
import { fetchMagazinePricing, priceForEdition, type MagazinePricing } from '@/lib/magazine-pricing'
import { fetchMagazineHomeMedia, type MagazineHomeMedia } from '@/lib/magazine-home-media'
import { formatMagazineMonthYear } from '@/lib/magazine-utils'
import {
  calcularPrecosDePlano,
  formatBRL,
  promoEndsAtInSaoPaulo,
  valorPorDiaMenosDe,
} from '@/lib/pricing'
import { Magazine } from '@/types'

/* Cores da identidade da nova Home */
const INK = '#1C1B18'
const CREAM = '#FAF8F3'
const YELLOW = '#FDBE2D'
const SEC_ON_DARK = '#D9D4C7'
const SEC_ON_DARK2 = '#C2BBAB'

/* Fontes da identidade */
const F_ANTON = "'Anton', 'Arial Narrow', sans-serif"
const F_PLAYFAIR = "'Playfair Display', Georgia, serif"
const F_INTER = "'Inter', system-ui, sans-serif"

/* Gradientes exatos da spec */
const BG_HERO =
  'radial-gradient(circle at 80% 40%, rgba(253,190,45,0.22) 0%, transparent 45%), #FAF8F3'
const BG_REVISTA = 'linear-gradient(135deg, #1E3832 0%, #2B4A40 55%, #3B4A36 100%)'
const HERO_INK = '#1C1B18'
const HERO_MUTED = '#5C574C'
const HERO_OUTLINE = '#D9D2C0'
const BG_CARD_PRECO = 'linear-gradient(160deg, #2A2620, #3E3428)'
const BG_FECHAMENTO =
  'radial-gradient(ellipse at 50% 0%, rgba(253,190,45,0.22) 0%, transparent 55%), linear-gradient(180deg, #3A3227, #2A2620)'

/* Blocos numerados da seção "NO PLANO PRATA" */
const PRATA_BLOCOS = [
  {
    titulo: 'Revista Digital',
    texto: 'Todas as edições, inclusive as que ainda vão sair.',
  },
  {
    titulo: 'Todos os cursos',
    texto: 'HOP, cultura de segurança, fatores humanos e mais.',
  },
  {
    titulo: 'Aulas ao vivo',
    texto: 'Pergunte, debata e aprenda junto com outros profissionais.',
  },
  {
    titulo: 'Mentorias −30%',
    texto: 'Sessões individuais com especialistas, com desconto de assinante.',
  },
]

/* Itens com ✓ do cartão de preço */
const PRATA_ITENS = [
  'Todas as edições da Revista Digital',
  'Todos os cursos e aulas ao vivo',
  '30% de desconto em mentorias',
]

/** Capa da edição da revista, em tamanho recortado para carregar leve. */
function coverUrl(mag: Magazine): string | null {
  if (!mag.thumbnail) return null
  return pb.files.getUrl(mag, mag.thumbnail, { thumb: '400x500' })
}

/** "R$ 0,50" → "0,50": remove o prefixo do formatBRL. O separador entre o
 *  símbolo e o valor pode ser espaço não separável (U+00A0) — por isso \s,
 *  e não o espaço simples. */
function semPrefixo(v: number): string {
  return formatBRL(v).replace(/^R\$\s?/, '')
}

/** Contagem regressiva até o fim da promoção (1 tick/s, só quando ativa). */
function useContagemPromo(fim: Date | null): string | null {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    if (!fim) return
    setAgora(Date.now())
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [fim])
  if (!fim) return null
  const s = Math.max(0, Math.floor((fim.getTime() - agora) / 1000))
  const d = Math.floor(s / 86400)
  const h = String(Math.floor((s % 86400) / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const seg = String(s % 60).padStart(2, '0')
  return d > 0 ? `${d}d ${h}:${m}:${seg}` : `${h}:${m}:${seg}`
}

export default function Index() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { plans } = useSubscriptionPlans()

  /* Dados reais: edições da revista (capas), preço avulso e mídia do hero */
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [magPricing, setMagPricing] = useState<MagazinePricing | null>(null)
  const [heroMedia, setHeroMedia] = useState<MagazineHomeMedia>({
    videoUrl: null,
    posterUrl: null,
    pages: 0,
  })
  const isMobile = useIsMobile()

  /* Redireciona estudante logado para a plataforma (mantém o comportamento atual) */
  useEffect(() => {
    if (!authLoading && user && user.role === 'student') {
      navigate('/plataforma', { replace: true })
    }
  }, [user, authLoading, navigate])

  /* Uma única rodada de buscas: falha de uma fonte não derruba a outra */
  useEffect(() => {
    let vivo = true
    Promise.allSettled([getMagazines(), fetchMagazinePricing(), fetchMagazineHomeMedia()]).then(
      (results) => {
        if (!vivo) return
        if (results[0].status === 'fulfilled') setMagazines(results[0].value)
        if (results[1].status === 'fulfilled') setMagPricing(results[1].value)
        if (results[2].status === 'fulfilled') setHeroMedia(results[2].value)
      },
    )
    return () => {
      vivo = false
    }
  }, [])

  /* Plano Prata e seus valores (promoção inclusa) — a Home se atualiza sozinha */
  const prata = useMemo(
    () => plans.find((p) => (p.name || '').trim().toLowerCase().startsWith('prata')) || null,
    [plans],
  )
  const prataPricing = useMemo(() => (prata ? calcularPrecosDePlano(prata) : null), [prata])

  const valorCartao = prataPricing ? valorPorDiaMenosDe(prataPricing.yearlyCardTotal) : null
  const valorPix = prataPricing ? valorPorDiaMenosDe(prataPricing.yearlyPixTotal) : null
  const parcela = prataPricing?.installment ?? null

  /* Promoção ativa: preço normal riscado + promocional + rótulo e término */
  const promoAtiva = !!(prataPricing?.promoActive && prataPricing.withoutPromo && prata)
  const promoFim = promoAtiva ? promoEndsAtInSaoPaulo(prata!.promo_ends_at) : null
  const promoFimFmt = promoFim
    ? promoFim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null
  const contagem = useContagemPromo(promoFim)

  /* Edições: ordem já vem '-created' do serviço; edição do mês = featured ou 1ª */
  const ediDoMes = magazines.find((m) => m.is_featured) || magazines[0] || null
  const precoEdicaoDoMes = ediDoMes && magPricing ? priceForEdition(magPricing, ediDoMes.id) : null
  const revistaCovers = magazines.slice(0, 5)
  const restantes = Math.max(0, magazines.length - revistaCovers.length)

  /* Hero: vídeo do admin só no desktop; sem vídeo (ou no celular), capa da
   * edição mais recente. No celular a tag <video> NEM chega a renderizar. */
  const mesHero = ediDoMes ? formatMagazineMonthYear(ediDoMes) : ''
  const pagesHero = heroMedia.pages
  /* O vídeo só existe depois do fetch (videoUrl nasce null), então no celular
   * ele NUNCA chega a montar: quando a mídia chega, isMobile já está correto. */
  const showVideo = !isMobile && !!heroMedia.videoUrl
  const capaHero = ediDoMes
  /* Imagem estática: no celular o poster cadastrado tem prioridade; no desktop
   * (sem vídeo) e sem poster, a capa da edição mais recente. */
  const urlCapaHero = capaHero ? coverUrl(capaHero) : null
  const imgHeroSrc = isMobile && heroMedia.posterUrl ? heroMedia.posterUrl : urlCapaHero

  return (
    <div className="overflow-x-hidden" style={{ background: CREAM, color: INK }}>
      {/* =====================================================================
          1. HERO
          ===================================================================== */}
      <section style={{ background: BG_HERO }} className="relative overflow-hidden">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-6 pt-12 sm:pt-16 lg:pt-20 pb-14 sm:pb-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center">
            {/* Coluna de texto (primeiro no celular, à esquerda no desktop) */}
            <div>
              <span
                className="inline-flex items-center px-4 py-2 text-[11px] sm:text-xs font-bold tracking-[0.16em] border"
                style={{
                  fontFamily: F_INTER,
                  color: HERO_MUTED,
                  borderColor: HERO_OUTLINE,
                  borderRadius: 999,
                }}
              >
                #SEJAEDUCAÇÃOSST
              </span>

              <h1
                className="mt-6 mb-5"
                style={{
                  fontFamily: F_PLAYFAIR,
                  fontWeight: 900,
                  color: HERO_INK,
                  fontSize: 'clamp(40px, 5vw, 68px)',
                  lineHeight: 1.05,
                }}
              >
                Quer evoluir na área de SST?
              </h1>

              <p
                className="italic mb-6"
                style={{
                  fontFamily: F_PLAYFAIR,
                  fontStyle: 'italic',
                  fontWeight: 800,
                  color: HERO_INK,
                  fontSize: 'clamp(22px, 2.4vw, 32px)',
                  lineHeight: 1.25,
                }}
              >
                Assine a revista digital e tenha acesso a plataforma de estudos.
              </p>

              <p
                className="text-[18px] leading-relaxed max-w-[540px] mb-8"
                style={{ fontFamily: F_INTER, color: HERO_MUTED }}
              >
                Revista mensal, cursos, aulas ao vivo, documentários e mentorias para quem quer
                estar capacitado para transformar a cultura de segurança e crescer na carreira.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 mb-6">
                <Button
                  asChild
                  size="lg"
                  className="h-12 min-h-[44px] px-8 rounded-full font-bold text-base bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-[0_8px_20px_rgba(253,190,45,0.28)] border border-[#e0a724]/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Link to="/planos" className="inline-flex items-center justify-center gap-2">
                    <span>Quero fazer parte</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  className="h-12 min-h-[44px] px-8 rounded-full font-semibold text-base bg-transparent hover:bg-[#1C1B18]/5 text-[#1C1B18] border border-[#1C1B18]/60 hover:border-[#1C1B18] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Link to="/register">Criar conta grátis</Link>
                </Button>
              </div>

              {valorCartao !== null && parcela !== null && (
                <p
                  className="text-[13px] sm:text-sm"
                  style={{ fontFamily: F_INTER, color: HERO_MUTED }}
                >
                  Plano Prata por menos de R$ {semPrefixo(valorCartao)} por dia · 12x de R${' '}
                  {semPrefixo(parcela)}
                </p>
              )}
            </div>

            {/* Vídeo da revista (desktop) / capa ou poster (celular) */}
            <div className="flex flex-col items-center">
              {/* Caixa na proporção real do vídeo (720×494) — nada de altura
               * fixa, scale ou cover: o vídeo aparece sempre inteiro. */}
              <div className="relative w-full max-w-[600px]" style={{ aspectRatio: '720 / 494' }}>
                {/* Vídeo da revista sendo folheada — só existe no desktop,
                 * dentro de um wrapper que não renderiza em telas pequenas. */}
                {showVideo && (
                  <div className="hidden lg:block absolute inset-0">
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      poster={heroMedia.posterUrl ?? undefined}
                      src={heroMedia.videoUrl ?? undefined}
                      className="absolute inset-0 w-full h-full"
                      style={{
                        objectFit: 'contain',
                        borderRadius: 16,
                        boxShadow: '0 30px 60px rgba(28,27,24,0.25)',
                      }}
                    />
                  </div>
                )}

                {/* Imagem estática: celular (poster → capa) e desktop sem vídeo (capa) */}
                {!showVideo &&
                  (imgHeroSrc || urlCapaHero ? (
                    <img
                      src={(imgHeroSrc || urlCapaHero)!}
                      alt={
                        isMobile && heroMedia.posterUrl
                          ? 'Capa (poster) da edição mais recente da Revista Educação SST'
                          : `Capa da edição mais recente da Revista Educação SST (${capaHero?.title})`
                      }
                      width={400}
                      height={500}
                      loading={isMobile ? 'eager' : 'lazy'}
                      fetchPriority={isMobile ? 'high' : 'low'}
                      decoding="async"
                      className="absolute inset-0 w-full h-full"
                      style={{
                        objectFit: 'contain',
                        borderRadius: 16,
                        boxShadow: '0 30px 60px rgba(28,27,24,0.25)',
                      }}
                    />
                  ) : (
                    /* Nem vídeo, nem poster, nem capa: quadro escuro de marca */
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                      style={{
                        borderRadius: 16,
                        background: '#2A2620',
                        color: SEC_ON_DARK,
                        boxShadow: '0 30px 60px rgba(28,27,24,0.25)',
                      }}
                    >
                      <span
                        className="text-2xl mb-2"
                        style={{ fontFamily: F_ANTON, color: YELLOW }}
                      >
                        EDUCAÇÃO SST.
                      </span>
                      <span className="text-sm" style={{ fontFamily: F_INTER }}>
                        Revista mensal de Segurança do Trabalho
                      </span>
                    </div>
                  ))}
              </div>

              {/* Selos abaixo do vídeo/capa — em UMA linha no desktop, 16px
               * abaixo da mídia; quebram linha só no celular (flex-wrap) */}
              <div className="mt-4 flex flex-wrap justify-center items-center gap-2.5 sm:gap-3">
                <span
                  className="inline-flex items-center whitespace-nowrap px-4 py-2 text-[11px] sm:text-xs font-bold tracking-[0.14em] rounded-full"
                  style={{ fontFamily: F_INTER, background: YELLOW, color: INK }}
                >
                  Nova edição todo mês
                </span>
                <span
                  className="inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 text-[11px] sm:text-xs font-bold tracking-[0.14em] rounded-full border"
                  style={{ fontFamily: F_INTER, color: HERO_INK, borderColor: HERO_OUTLINE }}
                >
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: '#2E8B57' }}
                  />
                  {pagesHero > 0
                    ? `Folheie a edição de ${mesHero}: ${pagesHero} páginas`
                    : `Folheie a edição de ${mesHero}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. FAIXA AMARELA — números do banco
          ===================================================================== */}
      <section aria-label="Números da revista" style={{ background: YELLOW }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-4 sm:py-5">
          <p
            className="font-extrabold text-[13px] sm:text-[15px] tracking-[0.06em] text-center"
            style={{ fontFamily: F_INTER, color: INK }}
          >
            {magazines.length > 0 && (
              <>
                <span
                  className="text-[17px] sm:text-[20px] align-baseline mr-1"
                  style={{ fontFamily: F_ANTON }}
                >
                  {magazines.length}
                </span>
                EDIÇÕES PUBLICADAS ·{' '}
              </>
            )}
            3º ANO DE REVISTA · COLUNISTAS ESPECIALISTAS · HOP · CULTURA · LIDERANÇA · FATORES
            HUMANOS
          </p>
        </div>
      </section>

      {/* =====================================================================
          4. A REVISTA
          ===================================================================== */}
      <section
        style={{ background: BG_REVISTA, color: CREAM }}
        className="relative overflow-hidden"
      >
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-center">
            <div>
              <span
                className="inline-block text-[11px] font-bold tracking-[0.2em] mb-4"
                style={{ fontFamily: F_INTER, color: YELLOW }}
              >
                A REVISTA
              </span>
              <h2
                className="text-[30px] leading-[1.12] sm:text-[40px] lg:text-[46px] mb-5"
                style={{ fontFamily: F_PLAYFAIR, fontWeight: 900, color: CREAM }}
              >
                Todo mês, o que está mudando na Segurança chega até você.
              </h2>
              <p
                className="text-[16px] leading-relaxed max-w-[520px] mb-8"
                style={{ fontFamily: F_INTER, color: SEC_ON_DARK }}
              >
                {magazines.length} edições escritas por quem está no campo: HOP, fatores humanos,
                cultura, liderança e normas. Leia no celular, no computador, quando quiser.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-12 min-h-[44px] px-7 rounded-full font-bold text-base bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] border border-[#e0a724]/40 shadow-none"
                >
                  <Link to="/planos">Ler todas no Prata</Link>
                </Button>
                {ediDoMes && precoEdicaoDoMes !== null && (
                  <Link
                    to={`/revistas?revista=${ediDoMes.id}`}
                    className="text-[15px] font-semibold underline underline-offset-4 hover:text-[#FDBE2D] transition-colors"
                    style={{ fontFamily: F_INTER, color: SEC_ON_DARK }}
                  >
                    Ou só a edição do mês: {formatBRL(precoEdicaoDoMes)}
                  </Link>
                )}
              </div>
            </div>

            {/* Grade 3×2: 5 capas reais + quadro tracejado */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {revistaCovers.map((mag) => {
                const url = coverUrl(mag)
                return (
                  <Link
                    key={mag.id}
                    to={`/revistas?revista=${mag.id}`}
                    aria-label={`Revista ${mag.title}`}
                    className="block rounded-lg overflow-hidden border border-[#FAF8F3]/15 bg-[#173F33] aspect-[4/5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDBE2D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3832]"
                  >
                    {url ? (
                      <img
                        src={url}
                        alt={`Capa da ${mag.title}`}
                        width={400}
                        height={500}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center p-2 text-center text-[11px]"
                        style={{ fontFamily: F_INTER, color: SEC_ON_DARK }}
                      >
                        {mag.title}
                      </div>
                    )}
                  </Link>
                )
              })}
              {restantes > 0 && (
                <Link
                  to="/revistas"
                  aria-label={`Ver todas as ${magazines.length} edições no acervo`}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#FAF8F3]/25 hover:border-[#FDBE2D]/60 transition-colors aspect-[4/5] p-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDBE2D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3832]"
                >
                  <span
                    className="text-[22px] sm:text-[26px] leading-none"
                    style={{ fontFamily: F_ANTON, color: YELLOW }}
                  >
                    +{restantes}
                  </span>
                  <span
                    className="mt-1 text-[11px] sm:text-xs leading-tight"
                    style={{ fontFamily: F_INTER, color: SEC_ON_DARK }}
                  >
                    edições no acervo
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. NO PLANO PRATA
          ===================================================================== */}
      <section style={{ background: CREAM }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <span
            className="inline-block text-[11px] font-bold tracking-[0.2em] mb-4"
            style={{ fontFamily: F_INTER, color: '#7F7869' }}
          >
            NO PLANO PRATA
          </span>
          <h2
            className="text-[30px] leading-[1.12] sm:text-[40px] lg:text-[46px] mb-10 sm:mb-14 max-w-[640px]"
            style={{ fontFamily: F_PLAYFAIR, fontWeight: 900, color: INK }}
          >
            Tudo que você precisa para crescer, num lugar só.
          </h2>

          <ol className="divide-y divide-[#E4DED1] border-y border-[#E4DED1]">
            {PRATA_BLOCOS.map((b, i) => (
              <li
                key={b.titulo}
                className="grid grid-cols-[auto_1fr] sm:grid-cols-[110px_1fr] gap-x-5 sm:gap-x-8 items-start py-6 sm:py-8"
              >
                <span
                  className="text-[34px] sm:text-[46px] leading-none pt-0.5"
                  style={{ fontFamily: F_ANTON, color: INK }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3
                    className="text-[19px] sm:text-[23px] font-bold mb-1.5"
                    style={{ fontFamily: F_INTER, color: INK }}
                  >
                    {b.titulo}
                  </h3>
                  <p
                    className="text-[15px] sm:text-[16px] leading-relaxed"
                    style={{ fontFamily: F_INTER, color: '#5F5A4F' }}
                  >
                    {b.texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =====================================================================
          6. PREÇO
          ===================================================================== */}
      <section style={{ background: YELLOW }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Esquerda: manchete */}
            <div>
              <h2
                className="text-[44px] leading-[0.98] sm:text-[64px] lg:text-[76px]"
                style={{ fontFamily: F_PLAYFAIR, fontWeight: 900, color: INK }}
              >
                Menos que um cafezinho.
              </h2>
              <p
                className="italic mt-2 text-[44px] leading-[0.98] sm:text-[64px] lg:text-[76px]"
                style={{ fontFamily: F_PLAYFAIR, fontStyle: 'italic', fontWeight: 800, color: INK }}
              >
                Por dia.
              </p>
              {valorCartao !== null && valorPix !== null && (
                <p
                  className="mt-6 text-[16px] sm:text-[18px] leading-relaxed max-w-[440px]"
                  style={{ fontFamily: F_INTER, color: '#4A453B' }}
                >
                  Revista, cursos, aulas ao vivo e desconto em mentorias por menos de R${' '}
                  {semPrefixo(valorCartao)} por dia. No Pix, menos de R$ {semPrefixo(valorPix)}.
                </p>
              )}
            </div>

            {/* Direita: cartão escuro */}
            <div
              className="rounded-[24px] p-7 sm:p-10 shadow-[0_30px_70px_rgba(28,27,24,0.25)]"
              style={{ background: BG_CARD_PRECO, color: CREAM }}
            >
              <p
                className="text-[11px] font-bold tracking-[0.2em] mb-5"
                style={{ fontFamily: F_INTER, color: SEC_ON_DARK2 }}
              >
                PLANO PRATA · ASSINATURA ANUAL
              </p>

              {parcela !== null && (
                <p className="leading-none">
                  <span
                    className="block text-[15px] sm:text-lg mb-2"
                    style={{ fontFamily: F_INTER, color: SEC_ON_DARK }}
                  >
                    12x de
                  </span>
                  <span
                    className="text-[64px] sm:text-[84px] lg:text-[92px]"
                    style={{ fontFamily: F_ANTON, color: YELLOW }}
                  >
                    R$ {semPrefixo(parcela)}
                  </span>
                </p>
              )}

              {/* Promoção: riscado + promocional + rótulo e término */}
              {promoAtiva && prataPricing?.withoutPromo && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-[15px]" style={{ fontFamily: F_INTER, color: SEC_ON_DARK2 }}>
                    <span className="line-through">
                      de R$ {semPrefixo(prataPricing.withoutPromo.installment)}
                    </span>
                    <span className="font-bold text-[#FDBE2D]">
                      {' '}
                      por R$ {semPrefixo(prataPricing.installment)}
                    </span>
                  </p>
                  {(prata?.promo_label?.trim() || promoFimFmt) && (
                    <p
                      className="text-[12px] font-semibold"
                      style={{ fontFamily: F_INTER, color: SEC_ON_DARK2 }}
                    >
                      {prata?.promo_label?.trim() || 'Oferta por tempo limitado'}
                      {promoFimFmt ? ` · termina em ${promoFimFmt}` : ''}
                      {contagem ? ` (${contagem})` : ''}
                    </p>
                  )}
                </div>
              )}

              {valorPix !== null && (
                <p
                  className="mt-4 text-[14px] sm:text-[15px]"
                  style={{ fontFamily: F_INTER, color: SEC_ON_DARK }}
                >
                  ou R$ {semPrefixo(prataPricing?.yearlyPixTotal ?? valorPix * 365)} à vista no Pix
                  (20% off)
                </p>
              )}

              <ul className="mt-7 space-y-3.5">
                {PRATA_ITENS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                      style={{ background: YELLOW, color: INK }}
                      aria-hidden="true"
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </span>
                    <span
                      className="text-[14px] sm:text-[15px] leading-snug"
                      style={{ fontFamily: F_INTER, color: CREAM }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className="mt-8 h-12 min-h-[44px] w-full rounded-full font-bold text-base bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] border border-[#e0a724]/40 shadow-none"
              >
                <Link to="/planos">Assinar o Prata</Link>
              </Button>

              <p
                className="mt-4 text-center text-[12px]"
                style={{ fontFamily: F_INTER, color: SEC_ON_DARK2 }}
              >
                Direito de arrependimento em até 7 dias
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. FECHAMENTO
          ===================================================================== */}
      <section style={{ background: BG_FECHAMENTO, color: CREAM }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-28 text-center">
          <h2
            className="mx-auto max-w-[820px] text-[28px] leading-[1.15] sm:text-[42px] lg:text-[52px]"
            style={{ fontFamily: F_PLAYFAIR, fontWeight: 900, color: CREAM }}
          >
            A próxima pessoa que volta para casa em segurança pode depender do que você aprende{' '}
            <em className="italic font-extrabold" style={{ color: YELLOW }}>
              hoje.
            </em>
          </h2>

          <div className="mt-9 flex flex-col sm:flex-row justify-center items-center gap-3.5">
            <Button
              asChild
              size="lg"
              className="h-12 min-h-[44px] px-8 rounded-full font-bold text-base bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-[0_8px_20px_rgba(253,190,45,0.28)] border border-[#e0a724]/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Link to="/planos" className="inline-flex items-center gap-2">
                <span>Quero fazer parte</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-12 min-h-[44px] px-8 rounded-full font-semibold text-base bg-transparent hover:bg-[#FDBE2D]/10 text-[#FAF8F3] border border-[#FAF8F3]/40 hover:border-[#FAF8F3]/70"
            >
              <Link to="/register">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. RODAPÉ
          ===================================================================== */}
      <footer style={{ background: '#24211C', color: SEC_ON_DARK }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-[13px]" style={{ fontFamily: F_INTER, color: SEC_ON_DARK2 }}>
            Educação SST LTDA · CNPJ 56.009.540/0001-90 · Presidente Prudente/SP
          </p>
          <nav
            aria-label="Links do rodapé"
            className="flex items-center gap-6 text-[13px]"
            style={{ fontFamily: F_INTER, color: SEC_ON_DARK }}
          >
            <Link to="/privacidade" className="hover:text-[#FDBE2D] transition-colors">
              Política de privacidade
            </Link>
            <Link to="/termos" className="hover:text-[#FDBE2D] transition-colors">
              Termos de uso
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
