import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/use-auth'
import { useStudentCatalog } from '@/hooks/use-student-catalog'
import { useStudentAccess } from '@/hooks/use-student-access'
import { useTrackAccess } from '@/hooks/use-track-access'
import { CategoryCard } from '@/components/student/CategoryCard'
import { ProductCard } from '@/components/student/ProductCard'
import { MentorshipList } from '@/components/student/MentorshipList'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft,
  BookOpen,
  Newspaper,
  Film,
  BookMarked,
  User,
  Users,
  ClipboardList,
  Video,
  Calendar,
  ChevronRight,
  BookX,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { ClockDisplay } from '@/components/student/ClockDisplay'
import {
  Magazine,
  Mentorship,
  LiveSession,
  DocProject,
  PlatformAnnouncement,
  AgoraDebate,
} from '@/types'
import { getMentorships } from '@/services/mentorships'
import { getLiveSessions } from '@/services/live'
import { getDocProjects } from '@/services/doc_projects'
import { getAnnouncements } from '@/services/announcements'
import { getFeaturedMagazine } from '@/services/magazines'
import { getDebates } from '@/services/agora'
import { AgoraCountdown } from '@/components/agora/AgoraCountdown'
import { BellRing, Radio, Megaphone, Crown, Award, Sparkles, Landmark } from 'lucide-react'

const tierConfig: Record<string, { label: string; icon: typeof Crown }> = {
  free: {
    label: 'Plano Free',
    icon: Sparkles,
  },
  prata: {
    label: 'Plano Prata',
    icon: Award,
  },
  ouro: {
    label: 'Plano Ouro',
    icon: Crown,
  },
}

export default function StudentDashboard() {
  const { user, loading } = useAuth()
  const { t, i18n } = useTranslation()
  const cat = useStudentCatalog()
  const access = useStudentAccess()
  const navigate = useNavigate()
  const [view, setView] = useState<'hub' | 'cursos' | 'revistas' | 'mentorias'>('hub')
  const [selectedMag, setSelectedMag] = useState<Magazine | null>(null)
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [docProjects, setDocProjects] = useState<DocProject[]>([])
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([])
  const [featuredMagazine, setFeaturedMagazine] = useState<Magazine | null>(null)
  const [debates, setDebates] = useState<AgoraDebate[]>([])

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'pt-BR'

  useTrackAccess('Hub', [view])

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?redirect=/plataforma')
    }
  }, [loading, user, navigate])

  useEffect(() => {
    if (!user) return
    getMentorships()
      .then(setMentorships)
      .catch(() => {})
    getLiveSessions()
      .then(setLiveSessions)
      .catch(() => {})
    getDocProjects()
      .then(setDocProjects)
      .catch(() => {})
    getAnnouncements()
      .then(setAnnouncements)
      .catch(() => {})
    getFeaturedMagazine(currentLang)
      .then(setFeaturedMagazine)
      .catch(() => {})
    getDebates("status != 'encerrado'")
      .then(setDebates)
      .catch(() => {})
  }, [user, currentLang])

  if (loading || !user) {
    return (
      <div className="p-12 text-center text-muted-foreground font-medium text-sm">
        Carregando...
      </div>
    )
  }

  const userTier = user.role === 'admin' ? 'ouro' : user.plan_tier || 'free'
  const tier = tierConfig[userTier] || tierConfig.free
  const isActive = user.contract_end_date && new Date(user.contract_end_date) >= new Date()

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'Bom dia'
    if (h >= 12 && h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const now = new Date()
  const isLiveVisible = (l: LiveSession) => {
    if (l.status === 'live') return true
    if (l.status !== 'scheduled') return false
    const diff = new Date(l.scheduled_at).getTime() - now.getTime()
    return diff <= 30 * 60 * 1000 && diff >= -60 * 60 * 1000
  }
  const visibleLives = liveSessions.filter(isLiveVisible)

  const cards = [
    {
      title: 'Cursos',
      desc: 'Formação completa em SST',
      icon: BookOpen,
      count: cat.courses.length,
      action: () => setView('cursos'),
    },
    {
      title: 'Revistas',
      desc: 'Acervo científico digital',
      icon: Newspaper,
      count: cat.magazines.length,
      action: () => setView('revistas'),
    },
    {
      title: 'Mentorias',
      desc: 'Sessões com especialistas',
      icon: Users,
      count: mentorships.length,
      action: () => setView('mentorias'),
    },
    {
      title: 'Documentários',
      desc: 'Produções audiovisuais',
      icon: Film,
      count: cat.documentaries.length,
      action: () => navigate('/plataforma/documentarios'),
    },
    {
      title: 'Aulas ao Vivo',
      desc: 'Transmissões e gravações',
      icon: Radio,
      count: liveSessions.length,
      action: () => navigate('/plataforma/live-sessions'),
    },
    {
      title: 'Simulados',
      desc: 'Teste seus conhecimentos',
      icon: ClipboardList,
      count: cat.simulados.length,
      action: () => navigate('/plataforma/simulados'),
    },
    {
      title: 'Caderno Virtual',
      desc: 'Mapas e Notas',
      icon: BookMarked,
      count: 0,
      action: () => navigate('/plataforma/caderno'),
    },
    {
      title: 'Ágora de Debates',
      desc: 'Discussões técnicas e votos',
      icon: Landmark,
      count: debates.length,
      action: () => navigate('/plataforma/agora'),
    },
    {
      title: 'Meu Perfil',
      desc: 'Gerenciar conta',
      icon: User,
      count: 0,
      action: () => navigate('/plataforma/perfil'),
    },
  ]

  const imgThumb = (item: any) =>
    item.thumbnail ? pb.files.getUrl(item, item.thumbnail) : undefined

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-foreground">
      {/* Cabeçalho de boas-vindas: fundo --background, título em Playfair, linha em --muted-foreground, selo pílula amarela com texto tinta */}
      <div className="bg-background border-b border-border py-8 md:py-10">
        <div className="container px-4 max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="w-16 h-16 border border-border bg-card shadow-sm">
              {user.avatar ? (
                <AvatarImage
                  src={pb.files.getUrl(user, user.avatar)}
                  alt={user.name}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-muted text-foreground text-2xl font-bold font-serif">
                {user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-1 tracking-tight">
                {getGreeting()}, {user.name?.trim() || 'Aluno'}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-muted-foreground text-sm font-sans">
                  Bem-vindo à sua área de estudos.
                </p>
                {/* Selo do plano: pílula amarela com texto tinta */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm">
                  <tier.icon className="w-3.5 h-3.5" />
                  {tier.label}
                  {!isActive && userTier !== 'free' ? ' (Expirado)' : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <ClockDisplay />
          </div>
        </div>
      </div>

      <div className="container px-4 max-w-6xl mx-auto py-8 md:py-10">
        {view === 'hub' ? (
          <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
            <div className="space-y-10">
              {visibleLives.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
                    <h2 className="font-serif text-2xl font-bold text-foreground">Aulas Ao Vivo</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {visibleLives.map((live) => {
                      const d = new Date(live.scheduled_at)
                      const dateStr = d.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                      const timeStr = d.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      const liveThumb = live.thumbnail
                        ? pb.files.getUrl(live, live.thumbnail)
                        : undefined
                      return (
                        <div
                          key={live.id}
                          className="overflow-hidden flex flex-col h-full border border-border rounded-[28px] bg-card text-card-foreground hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(28,27,24,0.08)] transition-all group"
                        >
                          {liveThumb ? (
                            <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                              <img
                                src={liveThumb}
                                alt={live.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-3 left-3">
                                <div className="bg-danger text-white text-xs font-bold shadow-sm px-3 py-1 rounded-full flex items-center">
                                  <Radio className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                                  Ao Vivo
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 pb-2 bg-muted/40 border-b border-border/50 flex items-center justify-between">
                              <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-foreground group-hover:bg-primary/20 transition-colors">
                                <Radio className="w-6 h-6 stroke-[1.75]" />
                              </div>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-danger text-white shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                Ao Vivo
                              </span>
                            </div>
                          )}
                          <div className="p-6 flex-grow flex flex-col">
                            <span className="label-overline mb-2">Transmissão</span>
                            <h3 className="font-serif text-lg font-bold line-clamp-2 leading-tight text-foreground mb-3">
                              {live.title}
                            </h3>
                            <div className="space-y-1.5 mt-auto pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> {dateStr} às {timeStr}
                              </p>
                              {live.instructor_name && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5" /> Instrutor: {live.instructor_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="p-6 pt-0 mt-auto">
                            <Button
                              onClick={() => navigate(`/plataforma/live/${live.id}`)}
                              className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11"
                            >
                              Acessar Transmissão
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="label-overline block mb-1">Módulos</span>
                    <h2 className="font-serif text-2xl font-bold text-foreground">
                      Sua plataforma
                    </h2>
                  </div>
                </div>
                {/* Blocos dos módulos (CategoryCard): cartões iguais em --card com borda fina --border, raio 28px, ícone em traço na cor --foreground, nome em Instrument Sans 600, contagem em --muted-foreground, hover com subida 4px e ponto amarelo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((c) => (
                    <CategoryCard
                      key={c.title}
                      title={c.title}
                      description={c.desc}
                      icon={c.icon}
                      count={c.count}
                      onClick={c.action}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Avisos em cartão branco/card, cada aviso em uma linha separada por fio, com ponto colorido (amarelo para novidade, success para confirmado, danger para ao vivo) */}
              <div className="bg-card p-6 rounded-[28px] shadow-sm border border-border sticky top-24">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-primary" />
                    <h2 className="font-serif text-lg font-bold text-foreground">
                      Quadro de Avisos
                    </h2>
                  </div>
                  <span className="label-overline text-[10px]">Atualizações</span>
                </div>

                <div className="divide-y divide-border">
                  {/* Debates Ativos da Ágora */}
                  {debates.length > 0 &&
                    debates.map((debate) => {
                      const mod = debate.expand?.moderador_id
                      const modName = mod?.name || mod?.email || 'Moderador'
                      return (
                        <div
                          key={debate.id}
                          className="py-4 first:pt-0 last:pb-0 space-y-2 cursor-pointer group"
                          onClick={() => navigate(`/plataforma/agora/${debate.id}`)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                              {/* Ponto amarelo para novidade */}
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              Ágora de Debates
                            </span>
                            <AgoraCountdown
                              dataTermino={debate.data_termino}
                              status={debate.status}
                              compact
                            />
                          </div>

                          <h3 className="font-sans font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {debate.tema}
                          </h3>

                          <p className="text-xs text-muted-foreground flex items-center justify-between">
                            <span>Mod: {modName}</span>
                            <span className="inline-flex items-center font-semibold text-foreground text-xs group-hover:translate-x-0.5 transition-transform">
                              Entrar <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                            </span>
                          </p>
                        </div>
                      )
                    })}

                  {/* Avisos cadastrados via PlatformAnnouncement */}
                  {announcements
                    .filter((a) => {
                      if (a.type?.includes('Ágora de Debates') && a.reference_id) {
                        return !debates.some((d) => d.id === a.reference_id)
                      }
                      return true
                    })
                    .map((a) => (
                      <div
                        key={a.id}
                        className="py-4 first:pt-0 last:pb-0 cursor-pointer group space-y-1"
                        onClick={() => {
                          if (a.type?.includes('Ágora de Debates') && a.reference_id) {
                            navigate(`/plataforma/agora/${a.reference_id}`)
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {a.title}
                          </p>
                        </div>
                        {a.type === 'Texto Customizado' && a.content && (
                          <div
                            className="text-xs text-muted-foreground pl-4 line-clamp-2 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: a.content }}
                          />
                        )}
                      </div>
                    ))}

                  {/* Linha de Aula ao Vivo: ponto --danger */}
                  {visibleLives.length > 0 && (
                    <div
                      className="py-4 first:pt-0 last:pb-0 cursor-pointer group space-y-1"
                      onClick={() => navigate(`/plataforma/live/${visibleLives[0].id}`)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-danger">
                          <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" />
                          Ao vivo agora
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Transmissão
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground pl-4 line-clamp-2 group-hover:text-danger transition-colors">
                        {visibleLives[0].title}
                      </p>
                    </div>
                  )}

                  {/* Linha de Novo Curso: ponto amarelo novidade */}
                  {cat.courses.length > 0 && (
                    <div
                      className="py-4 first:pt-0 last:pb-0 cursor-pointer group space-y-1"
                      onClick={() => setView('cursos')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          Novo Curso
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Curso
                        </span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground pl-4 line-clamp-2 group-hover:text-foreground transition-colors">
                        {cat.courses[0].title}
                      </p>
                    </div>
                  )}

                  {/* Linha de Novo Documentário: ponto amarelo */}
                  {docProjects.length > 0 && (
                    <div
                      className="py-4 first:pt-0 last:pb-0 cursor-pointer group space-y-1"
                      onClick={() => navigate('/plataforma/documentarios')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          Documentário
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Audiovisual
                        </span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground pl-4 line-clamp-2 group-hover:text-foreground transition-colors">
                        {docProjects[0].title}
                      </p>
                    </div>
                  )}

                  {/* Linha de Mentoria: ponto --success (confirmado) */}
                  {mentorships.length > 0 && (
                    <div
                      className="py-4 first:pt-0 last:pb-0 cursor-pointer group space-y-1"
                      onClick={() => setView('mentorias')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                          Mentoria Confirmada
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Agenda
                        </span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground pl-4 line-clamp-2 group-hover:text-foreground transition-colors">
                        {mentorships[0].title}
                      </p>
                    </div>
                  )}

                  {debates.length === 0 &&
                    visibleLives.length === 0 &&
                    cat.courses.length === 0 &&
                    docProjects.length === 0 &&
                    mentorships.length === 0 &&
                    announcements.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        Nenhum aviso no momento.
                      </p>
                    )}
                </div>
              </div>

              {featuredMagazine && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Newspaper className="w-4 h-4 text-primary" />
                    <h2 className="font-serif text-lg font-bold text-foreground">Revista do Mês</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/plataforma/revista/${featuredMagazine.id}`)}
                    className="group block w-full text-left"
                  >
                    <div className="flex flex-col bg-card rounded-[28px] border border-border overflow-hidden hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(28,27,24,0.08)] transition-all">
                      {featuredMagazine.thumbnail ? (
                        <div className="w-full aspect-[3/2] bg-muted overflow-hidden">
                          <img
                            src={pb.files.getUrl(featuredMagazine, featuredMagazine.thumbnail)}
                            alt={featuredMagazine.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="p-6 pb-2 bg-muted/40 border-b border-border/50 flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-foreground group-hover:bg-primary/20 transition-colors">
                            <Newspaper className="w-6 h-6 stroke-[1.75]" />
                          </div>
                          <span className="label-overline">Edição</span>
                        </div>
                      )}
                      <div className="p-6 flex flex-col justify-center">
                        <span className="label-overline text-[11px] mb-2">Edição em Destaque</span>
                        <h3 className="font-serif text-lg font-bold text-foreground mb-1 line-clamp-2">
                          {featuredMagazine.title}
                        </h3>
                        {featuredMagazine.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                            {featuredMagazine.summary}
                          </p>
                        )}
                        <span className="editorial-link text-sm text-foreground">
                          Ler agora <ChevronRight className="w-4 h-4 ml-1" />
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <Button
              variant="outline"
              onClick={() => setView('hub')}
              className="mb-8 rounded-full border-border hover:bg-muted text-foreground font-semibold px-5 h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Hub
            </Button>
            {view === 'cursos' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.courses.length === 0 ? (
                  <p className="text-muted-foreground col-span-full text-center py-12">
                    Nenhum curso disponível.
                  </p>
                ) : (
                  cat.courses.map((course) => {
                    const status = access.getAccessStatus(course)
                    return (
                      <ProductCard
                        key={course.id}
                        title={course.title}
                        description={course.description || ''}
                        imageUrl={imgThumb(course)}
                        status={status}
                        category="Curso"
                        accessUrl={
                          status !== 'locked' ? `/plataforma/curso/${course.id}/aula` : undefined
                        }
                        price={course.price}
                      />
                    )
                  })
                )}
              </div>
            )}
            {view === 'revistas' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="label-overline">
                    {currentLang === 'es' ? 'Revistas en Español 🇪🇸' : 'Revistas em Português 🇧🇷'}
                  </span>
                </div>
                {cat.magazines.length === 0 ? (
                  <div className="bg-card border border-border rounded-[28px] p-12 text-center text-muted-foreground space-y-3">
                    <BookX className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                    <p className="font-serif text-lg font-semibold text-foreground">
                      {t('dashboard.noMagazines')}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      {t('revistas.noneBody')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cat.magazines.map((mag) => (
                      <button
                        key={mag.id}
                        type="button"
                        onClick={() => setSelectedMag(mag)}
                        className="group text-left"
                      >
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted border border-border shadow-sm group-hover:shadow-[0_18px_40px_rgba(28,27,24,0.12)] transition-all group-hover:-translate-y-1">
                          {mag.thumbnail ? (
                            <img
                              src={pb.files.getUrl(mag, mag.thumbnail)}
                              alt={mag.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Newspaper className="w-12 h-12 text-muted-foreground/60" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-serif font-bold text-base text-foreground mt-3 line-clamp-2">
                          {mag.title}
                        </h3>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {view === 'mentorias' && <MentorshipList mentorships={mentorships} />}
          </div>
        )}
      </div>

      <Dialog open={!!selectedMag} onOpenChange={(open) => !open && setSelectedMag(null)}>
        <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 overflow-hidden bg-card/95 border-border rounded-[28px]">
          <DialogTitle className="sr-only">{selectedMag?.title}</DialogTitle>
          {selectedMag?.embed_code ? (
            <div
              className="w-full h-full bg-card [&>iframe]:w-full [&>iframe]:h-full"
              dangerouslySetInnerHTML={{ __html: selectedMag.embed_code }}
            />
          ) : selectedMag?.fliphtml5_link ? (
            <iframe
              src={selectedMag.fliphtml5_link}
              className="w-full h-full border-none rounded-[28px] bg-card"
              allowFullScreen
              scrolling="no"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium text-sm">
              Conteúdo não disponível.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
