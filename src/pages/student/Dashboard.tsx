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
import {
  ArrowLeft,
  BookOpen,
  Newspaper,
  Film,
  BookMarked,
  User,
  Users,
  ClipboardList,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Magazine, Mentorship } from '@/types'
import { getMentorships } from '@/services/mentorships'

const ph = (q: string, w = 800, h = 500) => `https://img.usecurling.com/p/${w}/${h}?q=${q}`

export default function StudentDashboard() {
  const { user, loading } = useAuth()
  const cat = useStudentCatalog()
  const access = useStudentAccess()
  const navigate = useNavigate()
  const [view, setView] = useState<'hub' | 'cursos' | 'revistas' | 'mentorias'>('hub')
  const [selectedMag, setSelectedMag] = useState<Magazine | null>(null)
  const [mentorships, setMentorships] = useState<Mentorship[]>([])

  useEffect(() => {
    getMentorships()
      .then(setMentorships)
      .catch(() => {})
  }, [])

  if (loading) return <div className="p-12 text-center text-slate-500">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />

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
      desc: 'Suas anotações',
      icon: BookMarked,
      count: 0,
      img: ph('notebook%20study'),
      gradient: 'from-amber-600 to-orange-800',
      action: () => navigate('/plataforma/caderno'),
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
        <div className="container px-4 max-w-6xl">
          <h1 className="text-3xl font-serif font-bold text-yellow-400 mb-1">Olá, {user.name}!</h1>
          <p className="text-slate-300 text-sm">Bem-vindo à sua área de estudos.</p>
        </div>
      </div>

      <div className="container px-4 max-w-6xl py-8">
        {view === 'hub' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
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
