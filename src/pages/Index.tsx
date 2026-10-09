import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { ArrowRight, BookOpen } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getMagazines } from '@/services/magazines'
import { getNews } from '@/services/news'
import { getCourses } from '@/services/courses'
import { getSimulados } from '@/services/simulados'
import { getLiveSessions } from '@/services/live'
import { getPublicDailyDose, PublicDailyDose } from '@/services/publicDose'
import { Magazine, News } from '@/types'
import { DailyDoseCard } from '@/components/DailyDoseCard'
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
  const [nextLiveTitle, setNextLiveTitle] = useState<string | null>(null)
  const [dailyDose, setDailyDose] = useState<PublicDailyDose | null>(null)
  const [doseLoading, setDoseLoading] = useState(true)

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
        const upcoming = lives.find((l) => l.status === 'scheduled') || lives[0]
        if (upcoming) {
          setNextLiveTitle(upcoming.title)
        }
      })
      .catch(() => {})

    // 6. Dose do dia (pública, determinística)
    getPublicDailyDose()
      .then((res) => {
        setDailyDose(res)
      })
      .finally(() => {
        setDoseLoading(false)
      })
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
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#1C1B18] text-xs sm:text-sm font-semibold border border-[#E4DED1] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#FDBE2D] shrink-0" />
              #SejaEducaçãoSST
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
                Revista, cursos, aulas ao vivo e simulados de Segurança e Saúde no Trabalho,
                reunidos em um itinerário de estudo que parte da sua realidade de trabalho.
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

            {/* Coluna direita: composição sobreposta Capa + Dose do dia */}
            <div className="lg:col-span-7 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[460px] pt-4 pb-4">
                {/* a) Capa da Revista mais recente (~270px, 3:4, alinhada à direita, inclinada 3 graus, flutuação lenta) */}
                <div className="flex justify-end pr-2 sm:pr-4">
                  <div className="w-[230px] sm:w-[270px] aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_24px_50px_-12px_rgba(28,27,24,0.35)] border border-[#E4DED1] bg-[#FAF8F3] relative z-10 animate-mag-float origin-bottom-right">
                    {featuredMag && featuredMag.thumbnail ? (
                      <img
                        src={pb.files.getUrl(featuredMag, featuredMag.thumbnail)}
                        alt={featuredMag.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#173F33] text-[#FAF8F3]">
                        <BookOpen className="w-12 h-12 text-[#FDBE2D] mb-3" />
                        <span className="font-serif font-bold text-lg">Revista Educação SST</span>
                        <span className="text-xs text-[#FAF8F3]/70 mt-1">Edição do Mês</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* b) Sobreposto à parte de baixo da capa, alinhado à esquerda: Cartão "Dose do dia" */}
                <div className="relative z-20 -mt-24 sm:-mt-28 pl-0 sm:pl-2">
                  <DailyDoseCard dose={dailyDose} loading={doseLoading} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SEÇÃO 2: A PLATAFORMA (fundo --muted #F2EEE4)
          ========================================================================= */}
      <section className="py-[72px] lg:py-[112px] bg-[#F2EEE4] relative">
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
          SEÇÃO 3: REVISTA (fundo --deep #173F33, texto --deep-foreground #F4F1E8)
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
