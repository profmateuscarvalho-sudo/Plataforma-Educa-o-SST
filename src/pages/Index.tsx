import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useStudentAccess } from '@/hooks/use-student-access'
import { useSubscriptionPlans } from '@/hooks/use-subscription-plans'
import { getMagazines } from '@/services/magazines'
import { getCourses } from '@/services/courses'
import { getMentorships } from '@/services/mentorships'
import { getDocProjects } from '@/services/doc_projects'
import { fetchMagazinePricing, type MagazinePricing } from '@/lib/magazine-pricing'
import {
  calcularPrecosDePlano,
  formatBRL,
  promoEndsAtInSaoPaulo,
  valorPorDiaMenosDe,
} from '@/lib/pricing'
import {
  CoursesShelf,
  DocumentariesShelf,
  MagazineShelf,
  MentorshipsShelf,
  PricingComparison,
  magazineCoverUrl,
} from '@/components/home/HomeShelves'
import { Course, DocProject, Magazine, Mentorship } from '@/types'

/** Contagem regressiva até o fim da promoção (1 tick por segundo, só quando ativa). */
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
  const access = useStudentAccess()

  // Dados reais das prateleiras e da faixa de números
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [docs, setDocs] = useState<DocProject[]>([])
  const [magPricing, setMagPricing] = useState<MagazinePricing | null>(null)
  const [dadosCarregados, setDadosCarregados] = useState(false)

  // Redireciona estudante logado para a plataforma
  useEffect(() => {
    if (!authLoading && user && user.role === 'student') {
      navigate('/plataforma', { replace: true })
    }
  }, [user, authLoading, navigate])

  // Uma única rodada de buscas: falha de uma fonte não derruba as outras
  useEffect(() => {
    let vivo = true
    Promise.allSettled([
      getMagazines(),
      getCourses(),
      getMentorships(),
      getDocProjects(),
      fetchMagazinePricing(),
    ]).then((results) => {
      if (!vivo) return
      if (results[0].status === 'fulfilled') setMagazines(results[0].value)
      if (results[1].status === 'fulfilled') setCourses(results[1].value)
      if (results[2].status === 'fulfilled') setMentorships(results[2].value)
      if (results[3].status === 'fulfilled') setDocs(results[3].value)
      if (results[4].status === 'fulfilled') setMagPricing(results[4].value)
      setDadosCarregados(true)
    })
    return () => {
      vivo = false
    }
  }, [])

  // Plano Prata e seus valores (promoção inclusa) — o hero se atualiza sozinho
  const prata = useMemo(
    () => plans.find((p) => (p.name || '').trim().toLowerCase().startsWith('prata')) || null,
    [plans],
  )
  const prataPricing = useMemo(() => (prata ? calcularPrecosDePlano(prata) : null), [prata])

  const valorCartao = prataPricing ? valorPorDiaMenosDe(prataPricing.yearlyCardTotal) : null
  const valorPix = prataPricing ? valorPorDiaMenosDe(prataPricing.yearlyPixTotal) : null
  const parcela = prataPricing?.installment ?? null

  // Faixa de promoção: só existe com promo ativa e data de término no futuro
  const promoAtiva = !!(prataPricing?.promoActive && prataPricing.withoutPromo && prata)
  const promoFim = promoAtiva ? promoEndsAtInSaoPaulo(prata!.promo_ends_at) : null
  const contagem = useContagemPromo(promoFim)

  // Edição mais recente da revista (destaque, senão a mais nova) — capa do hero
  const capaMag = magazines.find((m) => m.is_featured) || magazines[0] || null
  const capaUrl = capaMag ? magazineCoverUrl(capaMag) : null

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* =========================================================================
          1. TOPO / PRIMEIRA DOBRA
          ========================================================================= */}
      <section className="relative overflow-hidden bg-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-[0.45] dark:opacity-[0.25]"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 0.75px, transparent 0.75px)',
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(ellipse 85% 65% at 50% 20%, black 20%, transparent 80%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 85% 65% at 50% 20%, black 20%, transparent 80%)',
              color: 'hsl(var(--foreground) / 0.12)',
            }}
          />
          <div
            className="absolute -top-24 -right-24 w-[360px] sm:w-[520px] h-[360px] sm:h-[520px] rounded-full blur-3xl opacity-35 dark:opacity-20"
            style={{
              background:
                'radial-gradient(circle, #FDBE2D 0%, rgba(253, 190, 45, 0.2) 45%, transparent 70%)',
            }}
          />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 pt-10 sm:pt-14 lg:pt-16 pb-14 lg:pb-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Texto (primeiro no celular, à esquerda no desktop) */}
            <div>
              <div className="mb-5">
                <span
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-card text-foreground text-xs sm:text-sm font-semibold border border-border shadow-sm max-w-full"
                  style={{ borderRadius: '20px' }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#FDBE2D] shrink-0" />
                  <span className="tracking-tight">#SejaEducaçãoSST</span>
                </span>
              </div>

              <h1 className="title-h1-home text-foreground mb-6 max-w-xl">
                <span className="block not-italic font-extrabold text-foreground">
                  Revista, cursos e aulas ao vivo
                </span>
                {valorCartao !== null && (
                  <span className="block italic font-extrabold text-foreground mt-1">
                    por menos de{' '}
                    <span
                      className="inline-block relative pb-0.5"
                      style={{ boxShadow: 'inset 0 -0.24em 0 #FDBE2D' }}
                    >
                      {formatBRL(valorCartao)}
                    </span>{' '}
                    por dia
                  </span>
                )}
              </h1>

              {parcela !== null && valorPix !== null && (
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mb-8">
                  Assinatura anual Prata: 12x de {formatBRL(parcela)} ou menos de{' '}
                  {formatBRL(valorPix)} por dia no Pix.
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-[0_8px_20px_rgba(253,190,45,0.28)] text-base transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 border border-[#e0a724]/40"
                  asChild
                >
                  <Link to="/planos" className="inline-flex items-center justify-center gap-2">
                    <span>Assinar o Prata</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-7 rounded-full font-semibold bg-card/80 hover:bg-card text-foreground border-border hover:border-foreground/30 shadow-sm text-base transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                  asChild
                >
                  <Link to="/register">Criar conta grátis</Link>
                </Button>
              </div>
            </div>

            {/* Capa da edição mais recente (abaixo do texto no celular, à direita no desktop) */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-[240px] sm:w-[300px]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-2.5 sm:-inset-3 bg-gradient-to-br from-[#FDBE2D]/25 via-border/50 to-transparent brand-corner -rotate-1 opacity-70 dark:opacity-40"
                />
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_rgba(28,27,24,0.09)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                  {capaUrl && capaMag ? (
                    <img
                      src={capaUrl}
                      alt={`Capa da ${capaMag.title}`}
                      width={400}
                      height={500}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                      <BookOpen className="w-14 h-14 text-[#FDBE2D] mb-3" aria-hidden="true" />
                      <span className="font-serif font-bold text-lg text-foreground">
                        Revista Educação SST
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. FAIXA DE PROMOÇÃO (só existe com promo ativa e término no futuro)
          ========================================================================= */}
      {promoAtiva && prataPricing?.withoutPromo && (
        <section
          aria-label="Promoção por tempo limitado"
          className="bg-[#173F33] text-[#F4F1E8] border-y border-[#122e26]"
        >
          <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-center gap-2.5 sm:gap-6 text-center sm:text-left">
            <span className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold tracking-[0.12em] uppercase text-[#FDBE2D]">
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              {prata?.promo_label?.trim() || 'Oferta por tempo limitado'}
            </span>
            <span className="flex items-baseline justify-center gap-2.5 flex-wrap">
              <span className="text-sm text-[#F4F1E8]/60 line-through">
                12x de {formatBRL(prataPricing.withoutPromo.installment)}
              </span>
              <span className="font-bold text-base sm:text-lg text-[#FDBE2D]">
                12x de {formatBRL(prataPricing.installment)}
              </span>
            </span>
            {contagem && (
              <span className="text-sm font-mono font-semibold text-[#F4F1E8]">
                termina em {contagem}
              </span>
            )}
            <Link
              to="/planos"
              className="text-sm font-bold text-[#FDBE2D] hover:text-[#F4F1E8] transition-colors underline-offset-4 hover:underline"
            >
              Aproveitar &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* =========================================================================
          3. PRATELEIRAS + COMPARAÇÃO
          ========================================================================= */}
      <section className="py-14 sm:py-20 bg-background">
        <div className="max-w-[1200px] mx-auto px-6">
          {magazines.length > 0 && <MagazineShelf magazines={magazines} />}
          {courses.length > 0 && <CoursesShelf courses={courses} />}
          {mentorships.length > 0 && (
            <MentorshipsShelf mentorships={mentorships} tier={access.activeTier} />
          )}
          {docs.length > 0 && <DocumentariesShelf docs={docs} />}
        </div>
      </section>

      {prataPricing && valorCartao !== null && (
        <PricingComparison pricing={magPricing} perDay={valorCartao} />
      )}

      {/* =========================================================================
          4. FAIXA DE NÚMEROS (dados reais do banco)
          ========================================================================= */}
      {dadosCarregados && (
        <section
          aria-label="A plataforma em números"
          className="py-12 sm:py-16 bg-[#F2EEE4] border-b border-[#E4DED1]"
        >
          <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-serif text-4xl sm:text-5xl font-bold text-[#1C1B18]">
                {magazines.length}
              </p>
              <p className="text-sm text-[#5F5A4F] mt-1.5">
                {magazines.length === 1 ? 'edição da revista' : 'edições da revista'} no acervo
              </p>
            </div>
            <div>
              <p className="font-serif text-4xl sm:text-5xl font-bold text-[#1C1B18]">
                {courses.length}
              </p>
              <p className="text-sm text-[#5F5A4F] mt-1.5">
                {courses.length === 1 ? 'curso' : 'cursos'}{' '}
                {courses.length === 1 ? 'publicado' : 'publicados'}
              </p>
            </div>
            <div>
              <p className="font-serif text-4xl sm:text-5xl font-bold text-[#1C1B18]">
                {mentorships.length}
              </p>
              <p className="text-sm text-[#5F5A4F] mt-1.5">
                {mentorships.length === 1 ? 'mentoria' : 'mentorias'}{' '}
                {mentorships.length === 1 ? 'disponível' : 'disponíveis'}
              </p>
            </div>
          </div>
        </section>
      )}
      {/* 5. Rodapé: renderizado pelo Layout que envolve esta rota */}
    </div>
  )
}
