import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useStudentCatalog } from '@/hooks/use-student-catalog'
import { useStudentAccess } from '@/hooks/use-student-access'
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
  MessagesSquare,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { ClockDisplay } from '@/components/student/ClockDisplay'
import { Magazine, Mentorship, LiveSession, DocProject, PlatformAnnouncement } from '@/types'
import { getMentorships } from '@/services/mentorships'
import { getLiveSessions } from '@/services/live'
import { getDocProjects } from '@/services/doc_projects'
import { getAnnouncements } from '@/services/announcements'
import { BellRing, Radio, Megaphone } from 'lucide-react'

const ph = (q: string, w = 800, h = 500) => `https://img.usecurling.com/p/${w}/${h}?q=${q}`

export default function StudentDashboard() {
  const { user, loading } = useAuth()
  const cat = useStudentCatalog()
  const access = useStudentAccess()
  const navigate = useNavigate()
  const [view, setView] = useState<'hub' | 'cursos' | 'revistas' | 'mentorias'>('hub')
  const [selectedMag, setSelectedMag] = useState<Magazine | null>(null)
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [docProjects, setDocProjects] = useState<DocProject[]>([])
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([])

  useEffect(() => {
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
  }, [])

  if (loading) return <div className="p-12 text-center text-slate-500">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />

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
      img: ph('online%20course'),
      gradient: 'from-emerald-600 to-teal-800',
      action: () => setView('cursos'),
    },
    {
      title: 'Revistas',
      desc: 'Acervo científico digital',
      icon: Newspaper,
      count: cat.magazines.length,
      img: ph('digital%20magazine'),
      gradient: 'from-blue-600 to-cyan-800',
      action: () => setView('revistas'),
    },
    {
      title: 'Mentorias',
      desc: 'Sessões com especialistas',
      icon: Users,
      count: mentorships.length,
      img: ph('mentorship%20meeting'),
      gradient: 'from-rose-600 to-pink-800',
      action: () => setView('mentorias'),
    },
    {
      title: 'Documentários',
      desc: 'Produções audiovisuais',
      icon: Film,
      count: cat.documentaries.length,
      img: ph('documentary%20film'),
      gradient: 'from-purple-600 to-indigo-800',
      action: () => navigate('/plataforma/documentarios'),
    },
    {
      title: 'Aulas ao Vivo',
      desc: 'Transmissões e gravações',
      icon: Radio,
      count: liveSessions.length,
      img: ph('live%20streaming'),
      gradient: 'from-red-600 to-rose-800',
      action: () => navigate('/plataforma/live-sessions'),
    },
    {
      title: 'Simulados',
      desc: 'Teste seus conhecimentos',
      icon: ClipboardList,
      count: cat.simulados.length,
      img: ph('exam%20test'),
      gradient: 'from-cyan-600 to-blue-800',
      action: () => navigate('/simulados'),
    },
    {
      title: 'Caderno Virtual',
      desc: 'Mapas e Notas',
      icon: BookMarked,
      count: 0,
      img: ph('notebook%20study'),
      gradient: 'from-amber-600 to-orange-800',
      action: () => navigate('/plataforma/caderno'),
    },
    {
      title: 'Feed de Cases',
      desc: 'Compartilhe experiências',
      icon: MessagesSquare,
      count: 0,
      img: ph('professional%20cases'),
      gradient: 'from-teal-600 to-emerald-800',
      action: () => navigate('/plataforma/cases'),
    },
    {
      title: 'Meu Perfil',
      desc: 'Gerenciar conta',
      icon: User,
      count: 0,
      img: ph('user%20profile'),
      gradient: 'from-slate-700 to-slate-900',
      action: () => navigate('/plataforma/perfil'),
    },
  ]

  const imgThumb = (item: any) =>
    item.thumbnail ? pb.files.getUrl(item, item.thumbnail) : ph('education')

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-10">
        <div className="container px-4 max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Avatar className="w-16 h-16 border-2 border-yellow-400 bg-slate-800 shadow-xl">
              {user.avatar ? (
                <AvatarImage
                  src={pb.files.getUrl(user, user.avatar)}
                  alt={user.name}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-slate-800 text-yellow-400 text-2xl font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-serif font-bold text-yellow-400 mb-1">
                {getGreeting()}, {user.name?.trim() || 'Aluno'}
              </h1>
              <p className="text-slate-300 text-sm">Bem-vindo à sua área de estudos.</p>
            </div>
          </div>
          <div className="hidden md:block">
            <ClockDisplay />
          </div>
        </div>
      </div>

      <div className="container px-4 max-w-6xl py-8">
        {view === 'hub' ? (
          <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-10">
              {visibleLives.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <Video className="w-5 h-5 text-red-500" /> Aulas Ao Vivo
                  </h2>
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
                      return (
                        <div
                          key={live.id}
                          className="overflow-hidden flex flex-col h-full border border-slate-200 rounded-xl bg-white hover:shadow-lg transition-shadow group"
                        >
                          <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                            <img
                              src={
                                live.thumbnail
                                  ? pb.files.getUrl(live, live.thumbnail)
                                  : ph('live%20streaming%20class')
                              }
                              alt={live.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3">
                              <div className="bg-red-600 text-white text-xs font-bold shadow-sm border-none px-2.5 py-1 rounded-full flex items-center">
                                <Radio className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                                Ao Vivo
                              </div>
                            </div>
                          </div>
                          <div className="p-5 flex-grow flex flex-col">
                            <h3 className="font-serif text-lg font-bold line-clamp-2 leading-tight text-slate-800 mb-3">
                              {live.title}
                            </h3>
                            <div className="space-y-1.5 mt-auto">
                              <p className="text-sm text-slate-600 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-slate-400" /> {dateStr} às{' '}
                                {timeStr}
                              </p>
                              {live.instructor_name && (
                                <p className="text-sm text-slate-600 flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-slate-400" /> Instrutor:{' '}
                                  {live.instructor_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="p-5 pt-0 mt-auto flex justify-end">
                            <Button
                              onClick={() => navigate(`/plataforma/live/${live.id}`)}
                              className="w-full bg-red-600 hover:bg-red-700 text-white"
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
                <h2 className="text-xl font-bold text-slate-800 mb-5">Sua plataforma</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((c) => (
                    <CategoryCard
                      key={c.title}
                      title={c.title}
                      description={c.desc}
                      icon={c.icon}
                      imageUrl={c.img}
                      count={c.count}
                      gradient={c.gradient}
                      onClick={c.action}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
                <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-amber-500" /> Quadro de Avisos
                </h2>
                <div className="space-y-4">
                  {announcements.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 text-amber-900 cursor-pointer hover:bg-amber-100 transition-colors"
                    >
                      <Megaphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{a.title}</p>
                        {a.type === 'Texto Customizado' && a.content && (
                          <div
                            className="text-sm prose prose-sm max-w-none mt-1 line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: a.content }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {visibleLives.length > 0 && (
                    <div
                      className="flex items-start gap-3 p-3 rounded-lg bg-red-50 text-red-900 cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() => navigate(`/plataforma/live/${visibleLives[0].id}`)}
                    >
                      <Radio className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <p className="text-sm font-bold">Próxima Aula ao Vivo</p>
                        <p className="text-sm line-clamp-2">{visibleLives[0].title}</p>
                      </div>
                    </div>
                  )}
                  {cat.courses.length > 0 && (
                    <div
                      className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 text-emerald-900 cursor-pointer hover:bg-emerald-100 transition-colors"
                      onClick={() => setView('cursos')}
                    >
                      <BookOpen className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">Novo Curso Adicionado</p>
                        <p className="text-sm line-clamp-2">{cat.courses[0].title}</p>
                      </div>
                    </div>
                  )}
                  {docProjects.length > 0 && (
                    <div
                      className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 text-purple-900 cursor-pointer hover:bg-purple-100 transition-colors"
                      onClick={() => navigate('/plataforma/documentarios')}
                    >
                      <Film className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">Novo Documentário</p>
                        <p className="text-sm line-clamp-2">{docProjects[0].title}</p>
                      </div>
                    </div>
                  )}
                  {mentorships.length > 0 && (
                    <div
                      className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 text-blue-900 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => setView('mentorias')}
                    >
                      <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">Mentoria Disponível</p>
                        <p className="text-sm line-clamp-2">{mentorships[0].title}</p>
                      </div>
                    </div>
                  )}
                  {visibleLives.length === 0 &&
                    cat.courses.length === 0 &&
                    docProjects.length === 0 &&
                    mentorships.length === 0 &&
                    announcements.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Nenhum aviso no momento.
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => setView('hub')}
              className="mb-6 text-slate-600 hover:text-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Hub
            </Button>
            {view === 'cursos' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.courses.length === 0 ? (
                  <p className="text-slate-500 col-span-full text-center py-12">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cat.magazines.length === 0 ? (
                  <p className="text-slate-500 col-span-full text-center py-12">
                    Nenhuma revista disponível.
                  </p>
                ) : (
                  cat.magazines.map((mag) => (
                    <button
                      key={mag.id}
                      onClick={() => setSelectedMag(mag)}
                      className="group text-left"
                    >
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 shadow-md group-hover:shadow-2xl transition-all group-hover:-translate-y-1">
                        {mag.thumbnail ? (
                          <img
                            src={pb.files.getUrl(mag, mag.thumbnail)}
                            alt={mag.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Newspaper className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-serif font-bold text-sm text-secondary mt-3 line-clamp-2">
                        {mag.title}
                      </h3>
                    </button>
                  ))
                )}
              </div>
            )}
            {view === 'mentorias' && <MentorshipList mentorships={mentorships} />}
          </div>
        )}
      </div>

      <Dialog open={!!selectedMag} onOpenChange={(open) => !open && setSelectedMag(null)}>
        <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 overflow-hidden bg-black/5 border-none">
          <DialogTitle className="sr-only">{selectedMag?.title}</DialogTitle>
          {selectedMag?.embed_code ? (
            <div
              className="w-full h-full bg-white [&>iframe]:w-full [&>iframe]:h-full"
              dangerouslySetInnerHTML={{ __html: selectedMag.embed_code }}
            />
          ) : selectedMag?.fliphtml5_link ? (
            <iframe
              src={selectedMag.fliphtml5_link}
              className="w-full h-full border-none rounded-lg bg-white"
              allowFullScreen
              scrolling="no"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              Conteúdo não disponível.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
