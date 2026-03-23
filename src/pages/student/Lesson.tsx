import { useParams, Link, Navigate } from 'react-router-dom'
import { COURSES } from '@/lib/data'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CourseLesson() {
  const { id, lessonId } = useParams()
  const { user } = useAuth()

  if (!user || user.role !== 'student') return <Navigate to="/login" />

  const course = COURSES.find((c) => c.id === id)
  const lesson = course?.lessons.find((l) => l.id === lessonId)

  if (!course || !lesson) return <div>Aula não encontrada</div>

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-slate-900 text-slate-200">
      <div className="h-16 border-b border-white/10 flex items-center px-4 md:px-8 gap-4 bg-secondary">
        <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white">
          <Link to="/aluno">
            <ChevronLeft className="mr-2 w-4 h-4" /> Voltar ao Painel
          </Link>
        </Button>
        <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />
        <h1 className="font-medium truncate text-white">{course.title}</h1>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 p-4 md:p-8 flex flex-col">
          <div
            className="bg-black w-full rounded-xl overflow-hidden shadow-2xl relative"
            style={{ paddingTop: '56.25%' }}
          >
            {/* Panda Video Integration Required by Story */}
            <iframe
              src="https://player-vz-c2b2b8c9-251.tv.pandavideo.com.br/embed/?v=dummy"
              title="Panda Video Player"
              className="absolute top-0 left-0 w-full h-full border-none"
              allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
              allowFullScreen
            />
            <div className="absolute inset-0 flex items-center justify-center text-white/50 pointer-events-none bg-secondary/80">
              <span className="font-bold border border-white/20 px-4 py-2 rounded-lg bg-black/50">
                Simulação Panda Video Embed
              </span>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-3xl font-serif font-bold text-white mb-2">{lesson.title}</h2>
            <p className="text-slate-400">Desenvolvimento profissional focado na prática diária.</p>
          </div>
        </div>

        <aside className="w-full lg:w-96 border-l border-white/10 bg-secondary flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h3 className="font-bold text-white mb-2">Conteúdo do Curso</h3>
            <p className="text-sm text-slate-400">{course.lessons.length} aulas disponíveis</p>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {course.lessons.map((l, i) => (
              <Link
                key={l.id}
                to={`/aluno/curso/${course.id}/aula/${l.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${l.id === lessonId ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5'}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${l.id === lessonId ? 'bg-primary text-white' : 'bg-white/10 text-slate-400'}`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm font-medium ${l.id === lessonId ? 'text-primary-foreground' : 'text-slate-300'}`}
                >
                  {l.title}
                </span>
                {l.id !== lessonId && (
                  <CheckCircle className="w-4 h-4 text-primary ml-auto opacity-50" />
                )}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
