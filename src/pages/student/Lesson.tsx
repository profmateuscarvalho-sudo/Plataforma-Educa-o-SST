import { useParams, Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { ChevronLeft, PlayCircle, FileText, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { useEffect, useState } from 'react'
import { getCourse } from '@/services/courses'
import {
  getCourseModules,
  getCourseLessons,
  getCourseMaterials,
  getCourseQuizzes,
} from '@/services/curriculum'
import { Course, Module, Lesson, Material, Quiz } from '@/types'
import { QuizPlayer } from '@/components/student/QuizPlayer'
import pb from '@/lib/pocketbase/client'

const getPandaUrl = (val?: string) => {
  if (!val) return ''
  if (val.includes('<iframe') || val.includes('src="')) {
    const match = val.match(/src="([^"]+)"/)
    return match ? match[1] : ''
  }
  if (val.startsWith('http')) return val
  return `https://player-vz-c2b2b8c9-251.tv.pandavideo.com.br/embed/?v=${val}`
}

type ActiveItem = { type: 'lesson'; data: Lesson } | { type: 'quiz'; data: Quiz }

export default function CourseLesson() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getCourse(id),
      getCourseModules(id),
      getCourseLessons(id),
      getCourseMaterials(id),
      getCourseQuizzes(id),
    ])
      .then(([c, m, l, mat, q]) => {
        setCourse(c)
        setModules(m)
        setLessons(l)
        setMaterials(mat)
        setQuizzes(q)
        if (l.length > 0) {
          setActiveItem({ type: 'lesson', data: l[0] })
        } else if (q.length > 0) {
          setActiveItem({ type: 'quiz', data: q[0] })
        }
      })
      .catch(console.error)
  }, [id])

  if (loading) return null
  if (!user || (user.role !== 'student' && user.role !== 'admin')) return <Navigate to="/login" />
  if (!course) return <div className="p-8 text-white">Carregando aula...</div>

  let videoId = course.panda_video_id
  let activeTitle = course.title
  let activeDesc = course.description

  if (activeItem?.type === 'lesson') {
    videoId = activeItem.data.panda_video_id || course.panda_video_id
    activeTitle = activeItem.data.title
    activeDesc = activeItem.data.description
  }

  const iframeUrl = getPandaUrl(videoId)

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-slate-950 text-slate-200">
      <div className="h-16 border-b border-white/10 flex items-center px-4 md:px-8 gap-4 bg-slate-900 shrink-0">
        <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white">
          <Link to={user.role === 'admin' ? '/admin/cursos' : '/aluno'}>
            <ChevronLeft className="mr-2 w-4 h-4" /> Voltar
          </Link>
        </Button>
        <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />
        <h1 className="font-medium truncate text-white">{course.title}</h1>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full p-4 md:p-8 gap-8 items-start">
        <div className="flex-1 w-full space-y-6">
          {activeItem?.type === 'quiz' ? (
            <QuizPlayer quiz={activeItem.data} />
          ) : (
            <>
              <div
                className="bg-black w-full rounded-2xl overflow-hidden shadow-2xl relative border border-white/5"
                style={{ paddingTop: '56.25%' }}
              >
                {iframeUrl ? (
                  <iframe
                    src={iframeUrl}
                    title="Panda Video Player"
                    className="absolute top-0 left-0 w-full h-full border-none"
                    allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    Vídeo não disponível
                  </div>
                )}
              </div>
              <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-white/10">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">
                  {activeTitle}
                </h2>
                <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{activeDesc}</p>
              </div>
            </>
          )}
        </div>

        <div className="w-full lg:w-80 shrink-0 bg-slate-900 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/10 font-bold text-white tracking-wide">
            Conteúdo do Curso
          </div>
          <Accordion type="single" collapsible defaultValue={modules[0]?.id} className="w-full">
            {modules.map((mod) => (
              <AccordionItem
                value={mod.id}
                key={mod.id}
                className="border-white/10 border-b-0 border-t first:border-t-0"
              >
                <AccordionTrigger className="px-5 py-4 hover:bg-white/5 hover:no-underline text-sm font-semibold text-slate-200 text-left">
                  {mod.title}
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="flex flex-col bg-slate-950/50">
                    {lessons
                      .filter((l) => l.module === mod.id)
                      .map((l) => (
                        <button
                          key={l.id}
                          onClick={() => setActiveItem({ type: 'lesson', data: l })}
                          className={`text-left px-6 py-3.5 text-sm flex items-start gap-3 transition-colors ${
                            activeItem?.type === 'lesson' && activeItem.data.id === l.id
                              ? 'bg-primary/20 text-primary border-l-2 border-primary font-medium'
                              : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                          }`}
                        >
                          <PlayCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{l.title}</span>
                        </button>
                      ))}

                    {quizzes
                      .filter((q) => q.module === mod.id)
                      .map((q) => (
                        <button
                          key={q.id}
                          onClick={() => setActiveItem({ type: 'quiz', data: q })}
                          className={`text-left px-6 py-3.5 text-sm flex items-start gap-3 transition-colors ${
                            activeItem?.type === 'quiz' && activeItem.data.id === q.id
                              ? 'bg-primary/20 text-primary border-l-2 border-primary font-medium'
                              : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                          }`}
                        >
                          <CheckSquare className="w-4 h-4 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{q.title}</span>
                        </button>
                      ))}

                    {materials
                      .filter((m) => m.module === mod.id)
                      .map((m) => (
                        <a
                          key={m.id}
                          href={pb.files.getUrl(m, m.file)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-left px-6 py-3.5 text-sm flex items-start gap-3 text-slate-400 hover:text-accent hover:bg-white/5 border-l-2 border-transparent transition-colors"
                        >
                          <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{m.title}</span>
                        </a>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {modules.length === 0 && (
            <div className="p-6 text-sm text-slate-500 text-center">Nenhum módulo cadastrado.</div>
          )}
        </div>
      </div>
    </div>
  )
}
