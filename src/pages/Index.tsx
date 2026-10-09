import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  ArrowRight,
  BookOpen,
  Newspaper,
  Radio,
  ClipboardList,
  Users,
  Film,
  Sparkles,
  BellRing,
  ChevronRight,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getMagazines } from '@/services/magazines'
import { getNews } from '@/services/news'
import { getCourses } from '@/services/courses'
import { getSimulados } from '@/services/simulados'
import { getLiveSessions } from '@/services/live'
import { Magazine, News, LiveSession } from '@/types'
import { CategoryCard } from '@/components/student/CategoryCard'
import { PlatformExplorer } from '@/components/PlatformExplorer'
import { HomePlansSection } from '@/components/HomePlansSection'
import { BannerDisplay } from '@/components/BannerDisplay'

export default function Index() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Estados de dados dinâmicos do PocketBase
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [featuredMag, setFeaturedMag] = useState<Magazine | null>(null)
  const [newsList, setNewsList] = useState<News[]>([])
  const [courseCount, setCourseCount] = useState<number>(0)
  const [latestCourseTitle, setLatestCourseTitle] = useState<string | null>(null)
  const [simuladoCount, setSimuladoCount] = useState<number>(0)
  const [latestSimuladoTitle, setLatestSimuladoTitle] = useState<string | null>(null)
  const [nextLive, setNextLive] = useState<LiveSession | null>(null)
  const [nextLiveTitle, setNextLiveTitle] = useState<string | null>(null)

  // Redireciona estudante logado para a plataforma
  useEffect(() => {
    if (!authLoading && user && user.role === 'student') {
      navigate('/plataforma', { replace: true })
    }
  }, [user, authLoading, navigate])

  // Busca dados dinâmicos das coleções
  useEffect(() => {
    // 1. Revistas
    getMagazines()
      .then((mags) => {
        setMagazines(mags)
        const featured = mags.find((m) => m.is_featured) || mags[0]
        setFeaturedMag(featured || null)
      })
      .catch((err) => console.error('Erro ao carregar revistas:', err))

    // 2. Notícias (3 mais recentes)
    getNews()
      .then((items) => {
        setNewsList(items.slice(0, 3))
      })
      .catch((err) => console.error('Erro ao carregar notícias:', err))

    // 3. Cursos (para checar se há publicado e título do mais recente)
    getCourses()
      .then((courses) => {
        setCourseCount(courses.length)
        if (courses.length > 0) {
          setLatestCourseTitle(courses[0].title)
        }
      })
      .catch(() => {})

    // 4. Simulados (total e mais recente)
    getSimulados()
      .then((sims) => {
        const active = sims.filter((s) => s.active !== false)
        setSimuladoCount(active.length)
        if (active.length > 0) {
          setLatestSimuladoTitle(active[0].title)
        }
      })
      .catch(() => {})

    // 5. Aulas ao vivo (próxima aula)
    getLiveSessions()
      .then((lives) => {
        const upcoming =
          lives.find((l) => l.status === 'scheduled' || l.status === 'live') || lives[0]
        if (upcoming) {
          setNextLive(upcoming)
          setNextLiveTitle(upcoming.title)
        }
      })
      .catch(() => {})
  }, [])

  // Extrai número da revista mais recente (ex: "Revista nº32" -> "32")
  const latestMagazineNumber = (() => {
    if (!featuredMag) return '32'
    const match = featuredMag.title.match(/n[ºo°]?\s*(\d+)/i)
    return match ? match[1] : '32'
  })()

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
    } catch {
      return ''
    }
  }

  const formatLiveDateTime = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      return `${day} às ${time}`
    } catch {
      return ''
    }
  }

  // Seis módulos do Hub (mesmos ícones do Dashboard, ordem solicitada: Cursos, Revistas, Aulas ao vivo, Simulados, Mentorias, Documentários)
  const hubModules = [
    { title: 'Cursos', icon: BookOpen },
    { title: 'Revistas', icon: Newspaper },
    { title: 'Aulas ao vivo', icon: Radio },
    { title: 'Simulados', icon: ClipboardList },
    { title: 'Mentorias', icon: Users },
    { title: 'Documentários', icon: Film },
  ]

  const scrollToPlataforma = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById('plataforma')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F3] text-[#1C1B18] overflow-x-hidden">
      <BannerDisplay location="Home - Topo" className="px-6 pt-4 max-w-[1200px] mx-auto w-full" />

      {/* =========================================================================
          SEÇÃO 1: TOPO (fundo --background #FAF8F3)
          ========================================================================= */}
      <section className="pt-10 sm:pt-14 pb-[72px] lg:pb-[112px] relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Selo pílula branco com ponto amarelo */}
          <div className="mb-6 animate-hero-in">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-[#1C1B18] text-xs sm:text-sm font-semibold border border-[#E4DED1] shadow-sm max-w-full"
              style={{ borderRadius: '20px' }}
            >
              <span className="w-2 h-2 rounded-full bg-[#FDBE2D] shrink-0" />
              <span>Profissional de Segurança e Saúde no Trabalho</span>
            </span>
          </div>

          {/* Título enorme (h1) em duas linhas */}
          <h1 className="title-h1-home text-[#1C1B18] mb-12 sm:mb-16">
            <span className="block text-[#7F7869] font-normal font-serif">Menos informação.</span>
            <span className="block font-serif italic text-[#1C1B18] mt-1">
              Mais{' '}
              <span
                className="inline-block relative"
                style={{
                  boxShadow: 'inset 0 -0.24em 0 #FDBE2D',
                }}
              >
                direção.
              </span>
            </span>
          </h1>

          {/* Duas colunas (empilham no celular) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            {/* Coluna esquerda */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-8 pt-2">
              <p className="text-lg sm:text-[20px] text-[#5F5A4F] leading-relaxed font-normal">
                O Hub de estudos reúne Revista, cursos, aulas ao vivo e simulados de Segurança e
                Saúde no Trabalho em um só lugar, num itinerário que parte da sua realidade de
                trabalho.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none text-base"
                  asChild
                >
                  <Link to="/planos">Começar grátis</Link>
                </Button>
                <a
                  href="#planos"
                  className="editorial-link text-base font-semibold text-[#1C1B18] hover:text-[#173F33] py-2"
                >
                  Conhecer os planos &rarr;
                </a>
              </div>
            </div>

            {/* Coluna direita: Prévia do Hub de estudos */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-end w-full">
              <Link
                to="/planos"
                className="group block w-full max-w-[560px] text-left transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Conhecer o Hub de estudos nos planos"
              >
                <div className="w-full bg-card text-foreground brand-corner border border-border shadow-[0_18px_45px_rgba(28,27,24,0.08)] p-5 sm:p-7 relative transition-shadow duration-300 group-hover:shadow-[0_24px_55px_rgba(28,27,24,0.12)]">
                  {/* Cabeçalho do Hub */}
                  <div className="pb-4 sm:pb-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <span className="label-overline text-[10px] sm:text-[11px] text-muted-foreground block mb-1">
                        HUB DE ESTUDOS
                      </span>
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                        Bom dia. Sua área de estudos.
                      </h2>
                    </div>
                    {/* Selo pílula amarela "Plano Free" */}
                    <div className="self-start shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        Plano Free
                      </span>
                    </div>
                  </div>

                  {/* Grade com seis módulos (3 colunas iguais, 2 colunas abaixo de 480px, gap 10px) */}
                  <div className="pt-5 sm:pt-6">
                    <div
                      className="w-full grid gap-[10px] [grid-template-columns:repeat(2,minmax(0,1fr))] min-[480px]:[grid-template-columns:repeat(3,minmax(0,1fr))]"
                      style={{
                        gap: '10px',
                      }}
                    >
                      {hubModules.map((m) => (
                        <div key={m.title} className="w-full flex" tabIndex={-1} aria-hidden="true">
                          <CategoryCard
                            title={m.title}
                            icon={m.icon}
                            compact
                            className="w-full min-h-[92px] h-full pointer-events-none bg-background/60 hover:translate-y-0 hover:shadow-none flex flex-col justify-between items-start text-left"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bloco "AVISOS" com itens dinâmicos */}
                  {(nextLive || featuredMag) && (
                    <div className="mt-5 sm:mt-6 pt-4 border-t border-border/70">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <BellRing className="w-3.5 h-3.5 text-primary" />
                        <span className="label-overline text-[10px] text-muted-foreground">
                          AVISOS
                        </span>
                      </div>
                      <div className="space-y-2">
                        {nextLive && (
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/60 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-danger shrink-0 animate-pulse" />
                              <span className="font-semibold text-foreground truncate">
                                {nextLive.status === 'live' ? 'Ao vivo agora:' : 'Próxima aula:'}{' '}
                                {nextLive.title}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                              {nextLive.status === 'live'
                                ? 'Agora'
                                : formatLiveDateTime(nextLive.scheduled_at)}
                            </span>
                          </div>
                        )}
                        {featuredMag && (
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/60 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              <span className="font-semibold text-foreground truncate">
                                Revista mais recente: {featuredMag.title}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground shrink-0 flex items-center font-semibold">
                              Ler <ChevronRight className="w-3 h-3 ml-0.5" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>

              {/* Link de texto abaixo do cartão, alinhado à direita */}
              <div className="w-full max-w-[560px] flex justify-end mt-3 pr-1">
                <a
                  href="#plataforma"
                  onClick={scrollToPlataforma}
                  className="editorial-link text-sm sm:text-base font-semibold text-[#1C1B18] hover:text-[#173F33]"
                >
                  Ver o que tem no Hub &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SEÇÃO 2: REVISTA (fundo --deep #173F33, texto --deep-foreground #F4F1E8)
          ========================================================================= */}
      <section className="py-[72px] lg:py-[112px] bg-[#173F33] text-[#F4F1E8] relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Esquerda: capa da edição mais recente, 3:4, ~320px, inclinada -3 graus, sombra forte */}
            <div className="lg:col-span-5 flex justify-center">
              <div
                className="w-[260px] sm:w-[320px] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.6)] border border-white/10 bg-[#122e26] transition-transform hover:rotate-0 duration-500"
                style={{ transform: 'rotate(-3deg)' }}
              >
                {featuredMag && featuredMag.thumbnail ? (
                  <img
                    src={pb.files.getUrl(featuredMag, featuredMag.thumbnail)}
                    alt={featuredMag.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#F4F1E8]">
                    <BookOpen className="w-16 h-16 text-[#FDBE2D] mb-4" />
                    <span className="font-serif font-bold text-xl">Revista Educação SST</span>
                    <span className="text-sm text-[#F4F1E8]/70 mt-1">Ano III</span>
                  </div>
                )}
              </div>
            </div>

            {/* Direita: Textos e links editoriais */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="font-sans text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-[#FDBE2D]">
                  REVISTA EDUCAÇÃO SST &middot; ANO III
                </span>
                <h2 className="title-h2-fluid text-[#F4F1E8] mt-3">
                  Todo mês, uma edição para pensar a segurança{' '}
                  <em className="text-[#FDBE2D]">com mais profundidade.</em>
                </h2>
              </div>

              <p className="text-base sm:text-lg text-[#F4F1E8]/80 leading-relaxed max-w-xl font-normal">
                As {magazines.length || 32} edições estão no acervo, com leitura gratuita. No plano
                Ouro, a edição impressa chega na sua casa pelo Box+.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-wrap">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none text-base"
                  asChild
                >
                  <Link to="/revistas">Ler a edição do mês</Link>
                </Button>

                <div className="flex items-center gap-6">
                  <Link
                    to="/revistas"
                    className="editorial-link text-sm sm:text-base font-semibold text-[#F4F1E8] hover:text-[#FDBE2D]"
                  >
                    Ver o acervo &rarr;
                  </Link>
                  <Link
                    to="/submeter-artigo"
                    className="editorial-link text-sm sm:text-base font-semibold text-[#F4F1E8]/85 hover:text-[#FDBE2D]"
                  >
                    Submeter um artigo &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SEÇÃO 3: A PLATAFORMA (fundo --background #FAF8F3)
          ========================================================================= */}
      <section
        id="plataforma"
        className="py-[72px] lg:py-[112px] bg-[#FAF8F3] scroll-mt-16 relative"
      >
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-10 sm:mb-14">
            <span className="label-overline">A PLATAFORMA</span>
            <h2 className="title-h2-fluid text-[#1C1B18] mt-2 mb-3">
              Um itinerário, <em>não um catálogo.</em>
            </h2>
            <p className="text-base sm:text-lg text-[#5F5A4F] max-w-2xl">
              Escolha por onde começar. Cada parte da plataforma conversa com as outras.
            </p>
          </div>

          <PlatformExplorer
            magazineCount={magazines.length || 32}
            latestMagazine={
              featuredMag
                ? { number: latestMagazineNumber, title: featuredMag.title }
                : { number: '32', title: 'Edição de Setembro' }
            }
            courseCount={courseCount}
            latestCourseTitle={latestCourseTitle}
            nextLiveTitle={nextLiveTitle}
            simuladoCount={simuladoCount || 5}
            latestSimuladoTitle={latestSimuladoTitle}
          />
        </div>
      </section>

      {/* =========================================================================
          SEÇÃO 4: PLANOS (fundo --muted #F2EEE4)
          ========================================================================= */}
      <HomePlansSection />

      {/* =========================================================================
          SEÇÃO 5: NOTÍCIAS (fundo --background #FAF8F3)
          ========================================================================= */}
      {newsList.length > 0 && (
        <section className="py-[72px] lg:py-[112px] bg-[#FAF8F3] relative border-t border-[#E4DED1]">
          <div className="max-w-[1200px] mx-auto px-6">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14 pb-4">
              <div>
                <span className="label-overline">NOTÍCIAS DO SETOR</span>
                <h2 className="title-h2-fluid text-[#1C1B18] mt-2">
                  O que mudou <em>esta semana.</em>
                </h2>
              </div>
              <Link
                to="/noticias"
                className="editorial-link text-sm sm:text-base font-semibold text-[#1C1B18] shrink-0"
              >
                Ver todas &rarr;
              </Link>
            </div>

            {/* Lista editorial sem imagem */}
            <div className="border-t border-[#E4DED1]">
              {newsList.map((item) => (
                <Link
                  key={item.id}
                  to={`/noticias/${item.id}`}
                  className="group block py-6 sm:py-8 border-b border-[#E4DED1] transition-all duration-300 hover:translate-x-3"
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8 flex-1 min-w-0">
                      <span className="text-sm text-[#7F7869] font-mono shrink-0 w-24">
                        {formatDate(item.created)}
                      </span>
                      <h3 className="font-serif text-lg sm:text-xl md:text-[26px] font-semibold text-[#1C1B18] group-hover:text-[#173F33] transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                    <div className="text-[#1C1B18] group-hover:text-[#173F33] transition-transform group-hover:translate-x-1 shrink-0">
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SEÇÃO 6: CHAMADA FINAL (fundo amarelo --primary #FDBE2D, texto tinta #1C1B18)
          ========================================================================= */}
      <section className="py-[72px] lg:py-[112px] bg-[#FDBE2D] text-[#1C1B18] relative">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="title-h2-fluid text-[#1C1B18] mb-4">
            Comece pela edição <em>deste mês.</em>
          </h2>
          <p className="text-base sm:text-xl text-[#1C1B18]/85 max-w-xl mx-auto mb-8 font-normal leading-relaxed">
            Crie sua conta no plano Free e leia a Revista hoje. O resto do itinerário você descobre
            no seu ritmo.
          </p>
          <div className="flex justify-center">
            <Button
              size="lg"
              className="h-12 sm:h-14 px-9 rounded-full font-bold bg-[#1C1B18] hover:bg-[#1C1B18]/90 text-[#FAF8F3] shadow-md text-base transition-transform hover:scale-105"
              asChild
            >
              <Link to="/planos">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
