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
  const [studentCount, setStudentCount] = useState<number | null>(null)

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

    // 6. Alunos ativos (social proof com dado real da coleção users)
    pb.collection('users')
      .getList(1, 1, { filter: "role = 'student'" })
      .then((res) => {
        if (res.totalItems > 0) {
          setStudentCount(res.totalItems)
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
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <BannerDisplay location="Home - Topo" className="px-6 pt-4 max-w-[1200px] mx-auto w-full" />

      {/* =========================================================================
          SEÇÃO 1: TOPO / PRIMEIRA DOBRA (fundo --background #FAF8F3)
          ========================================================================= */}
      <section className="pt-8 sm:pt-12 lg:pt-14 pb-[72px] lg:pb-[104px] relative overflow-hidden bg-background">
        {/* Fundo editorial sutil e profissional: micro-grid discreto e acento de luz suave em tinta/amarelo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none overflow-hidden"
        >
          {/* Grade quadriculada sutil com máscara radial suave para suavizar as bordas */}
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

          {/* Glow suave no topo direito (dourado/amarelo característico da marca) */}
          <div
            className="absolute -top-24 -right-24 w-[360px] sm:w-[520px] h-[360px] sm:h-[520px] rounded-full blur-3xl opacity-35 dark:opacity-20"
            style={{
              background:
                'radial-gradient(circle, #FDBE2D 0%, rgba(253, 190, 45, 0.2) 45%, transparent 70%)',
            }}
          />

          {/* Linha fina decorativa horizontal sutil no topo do hero */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          {/* Selo pílula branco com ponto amarelo + hashtag da campanha */}
          <div className="mb-5 sm:mb-6 animate-hero-in">
            <span
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 bg-card text-foreground text-xs sm:text-sm font-semibold border border-border shadow-sm max-w-full hover:border-[#FDBE2D]/60 transition-colors"
              style={{ borderRadius: '20px' }}
            >
              <span className="w-2 h-2 rounded-full bg-[#FDBE2D] shrink-0 animate-pulse" />
              <span className="tracking-tight">#SejaEducaçãoSST</span>
            </span>
          </div>

          {/* Título de impacto (h1) em Playfair Display 800 */}
          <h1 className="title-h1-home text-foreground mb-10 sm:mb-14 lg:mb-16 max-w-4xl">
            <span className="block not-italic font-extrabold text-foreground">Seja bem-vindo</span>
            <span className="block italic font-extrabold text-foreground mt-1 sm:mt-1.5">
              à{' '}
              <span
                className="inline-block relative pb-0.5 sm:pb-1"
                style={{
                  boxShadow: 'inset 0 -0.24em 0 #FDBE2D',
                }}
              >
                Educação SST.
              </span>
            </span>
          </h1>

          {/* Duas colunas com alinhamento e proporções refinadas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 xl:gap-12 items-center">
            {/* Coluna esquerda: Apresentação, CTAs pílula e Social Proof com dados reais */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6 sm:space-y-8">
              {/* Parágrafo de abertura com linha de guia editorial vertical sutil */}
              <div className="relative pl-4 sm:pl-5 border-l-2 border-[#FDBE2D]/80">
                <p className="text-base sm:text-lg lg:text-[19px] xl:text-[20px] text-muted-foreground leading-relaxed font-normal">
                  O Hub de estudos reúne, em um só lugar, revista, cursos, aulas ao vivo, simulados,
                  documentários e caderno de estudos digital: um itinerário de Segurança e Saúde no
                  Trabalho que parte da sua realidade de trabalho.
                </p>
              </div>

              {/* CTAs em destaque: Par de botões pílula profissionais */}
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4">
                <Button
                  size="lg"
                  className="h-12 sm:h-12.5 px-8 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-[0_8px_20px_rgba(253,190,45,0.28)] hover:shadow-[0_12px_28px_rgba(253,190,45,0.38)] text-base transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 border border-[#e0a724]/40"
                  asChild
                >
                  <Link to="/planos" className="inline-flex items-center justify-center gap-2">
                    <span>Começar grátis</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 sm:h-12.5 px-7 rounded-full font-semibold bg-card/80 hover:bg-card text-foreground border-border hover:border-foreground/30 shadow-sm text-base transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                  asChild
                >
                  <a href="#planos" className="inline-flex items-center justify-center gap-1.5">
                    <span>Conhecer os planos</span>
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                </Button>
              </div>

              {/* Social Proof discreto com dados REAIS das coleções (omitido se não houver dados) */}
              {(magazines.length > 0 || (studentCount !== null && studentCount > 0)) && (
                <div className="pt-2 sm:pt-4 border-t border-border/70 flex items-center gap-6 sm:gap-8 flex-wrap">
                  {magazines.length > 0 && (
                    <div className="flex flex-col">
                      <span className="font-serif font-extrabold text-xl sm:text-2xl text-foreground tracking-tight leading-none">
                        {magazines.length}
                        <span className="text-[#FDBE2D] ml-0.5">+</span>
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 font-medium">
                        edições da revista
                      </span>
                    </div>
                  )}

                  {studentCount !== null && studentCount > 0 && (
                    <div className="flex flex-col">
                      <span className="font-serif font-extrabold text-xl sm:text-2xl text-foreground tracking-tight leading-none">
                        {studentCount}
                        <span className="text-[#FDBE2D] ml-0.5">+</span>
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 font-medium">
                        profissionais no ecossistema
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <span className="font-serif font-extrabold text-xl sm:text-2xl text-foreground tracking-tight leading-none">
                      6
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 font-medium">
                      módulos integrados
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna direita: Prévia do Hub de estudos protagonista com profundidade */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-end w-full">
              {/* Wrapper relativo com camada decorativa atrás dando profundidade sutil de marca */}
              <div className="relative w-full max-w-[580px]">
                {/* Camada traseira de profundidade: leve moldura inclinada em tinta/dourado */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-2.5 sm:-inset-3 bg-gradient-to-br from-[#FDBE2D]/25 via-border/50 to-transparent brand-corner -rotate-1 opacity-70 dark:opacity-40 transition-transform duration-500"
                />

                <Link
                  to="/planos"
                  className="group relative block w-full text-left transition-all duration-300 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Conhecer o Hub de estudos nos planos"
                >
                  <div className="w-full bg-card text-foreground brand-corner border border-border shadow-[0_20px_50px_rgba(28,27,24,0.09)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] p-5 sm:p-7 relative transition-all duration-300 group-hover:shadow-[0_28px_65px_rgba(28,27,24,0.14)] dark:group-hover:shadow-[0_28px_65px_rgba(0,0,0,0.6)] group-hover:border-[#FDBE2D]/50">
                    {/* Cabeçalho do Hub */}
                    <div className="pb-4 sm:pb-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FDBE2D]" />
                          <span className="label-overline text-[10px] sm:text-[11px] text-muted-foreground">
                            HUB DE ESTUDOS
                          </span>
                        </div>
                        <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                          Bom dia. Sua área de estudos.
                        </h2>
                      </div>
                      {/* Selo pílula amarela "Plano Free" */}
                      <div className="self-start shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FDBE2D] text-[#1C1B18] shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 fill-[#1C1B18]/20" />
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
                          <div
                            key={m.title}
                            className="w-full flex"
                            tabIndex={-1}
                            aria-hidden="true"
                          >
                            <CategoryCard
                              title={m.title}
                              icon={m.icon}
                              compact
                              className="w-full min-h-[92px] h-full pointer-events-none bg-background/70 hover:translate-y-0 hover:shadow-none flex flex-col justify-between items-start text-left border-border/80 transition-colors group-hover:bg-background/90"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bloco "AVISOS" com itens dinâmicos (oculto se não houver dado) */}
                    {(nextLive || featuredMag) && (
                      <div className="mt-5 sm:mt-6 pt-4 border-t border-border/70">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <BellRing className="w-3.5 h-3.5 text-[#FDBE2D]" />
                          <span className="label-overline text-[10px] text-muted-foreground font-bold">
                            AVISOS
                          </span>
                        </div>
                        <div className="space-y-2">
                          {nextLive && (
                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/60 text-xs hover:bg-muted/80 transition-colors">
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
                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/60 text-xs hover:bg-muted/80 transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-[#FDBE2D] shrink-0" />
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
              </div>

              {/* Link de texto abaixo do cartão, alinhado à direita rolando até "A plataforma" */}
              <div className="w-full max-w-[580px] flex justify-end mt-3.5 pr-1">
                <a
                  href="#plataforma"
                  onClick={scrollToPlataforma}
                  className="editorial-link text-sm sm:text-base font-semibold text-foreground hover:text-[#173F33] dark:hover:text-[#FDBE2D] transition-colors"
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
            Menos informação. <em>Mais direção.</em>
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
