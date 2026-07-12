import { useParams, Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { ChevronLeft, PlayCircle, FileText, CheckSquare, Star, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { useEffect, useState } from 'react'
import { getCourse } from '@/services/courses'
import {
  getCourseModules,
  getCourseLessons,
  getCourseMaterials,
  getCourseQuizzes,
} from '@/services/curriculum'
import { getCompletions, toggleCompletion, getLessonRatings, rateLesson } from '@/services/student'
import { Course, Module, Lesson, Material, Quiz, LessonCompletion, LessonRating } from '@/types'
import { QuizPlayer } from '@/components/student/QuizPlayer'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

const getPandaUrl = (val?: string) => {
  if (!val) return ''
  if (val.includes('<iframe') || val.includes('src="')) {
    const m = val.match(/src="([^"]+)"/)
    return m ? m[1] : ''
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
  const [completions, setCompletions] = useState<LessonCompletion[]>([])
  const [ratings, setRatings] = useState<LessonRating[]>([])
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')

  useEffect(() => {
    if (!id || !user) return
    Promise.all([
      getCourse(id),
      getCourseModules(id),
      getCourseLessons(id),
      getCourseMaterials(id),
      getCourseQuizzes(id),
      getCompletions(user.id),
    ])
      .then(([c, m, l, mat, q, comp]) => {
        setCourse(c)
        setModules(m)
        setLessons(l)
        setMaterials(mat)
        setQuizzes(q)
        setCompletions(comp)
        if (l.length > 0) setActiveItem({ type: 'lesson', data: l[0] })
        else if (q.length > 0) setActiveItem({ type: 'quiz', data: q[0] })
      })
      .catch(console.error)
  }, [id, user])

  useEffect(() => {
    if (activeItem?.type === 'lesson') {
      getLessonRatings(activeItem.data.id).then((r) => {
        setRatings(r)
        const mine = r.find((x) => x.user === user?.id)
        if (mine) {
          setMyRating(mine.rating)
          setMyComment(mine.comment)
        } else {
          setMyRating(0)
          setMyComment('')
        }
      })
    }
  }, [activeItem, user])

  if (loading) return null
  if (!user || (user.role !== 'student' && user.role !== 'admin')) return <Navigate to="/login" />

  const isSubscriptionExpired =
    !user.contract_end_date || new Date(user.contract_end_date) < new Date()
  if (user.role === 'student' && isSubscriptionExpired) {
    return <Navigate to="/planos?expired=1" />
  }

  if (!course) return <div className="p-8 text-white">Carregando aula...</div>

  const progress = lessons.length ? (completions.length / lessons.length) * 100 : 0
  const isCurrentCompleted =
    activeItem?.type === 'lesson' && completions.some((c) => c.lesson === activeItem.data.id)
  const compRecord =
    activeItem?.type === 'lesson'
      ? completions.find((c) => c.lesson === activeItem.data.id)
      : undefined

  const handleCompleteNext = async () => {
    if (activeItem?.type !== 'lesson') return
    if (!isCurrentCompleted) {
      await toggleCompletion(activeItem.data.id, user.id, false)
      setCompletions(await getCompletions(user.id))
    }
    const idx = lessons.findIndex((l) => l.id === activeItem.data.id)
    if (idx >= 0 && idx < lessons.length - 1)
      setActiveItem({ type: 'lesson', data: lessons[idx + 1] })
  }

  const submitRating = async () => {
    if (activeItem?.type !== 'lesson' || myRating === 0) return
    await rateLesson({
      user: user.id,
      lesson: activeItem.data.id,
      rating: myRating,
      comment: myComment,
    })
    const r = await getLessonRatings(activeItem.data.id)
    setRatings(r)
  }

  const videoId =
    activeItem?.type === 'lesson'
      ? activeItem.data.panda_video_id || course.panda_video_id
      : course.panda_video_id
  const activeTitle = activeItem?.type === 'lesson' ? activeItem.data.title : course.title
  const activeDesc =
    activeItem?.type === 'lesson' ? activeItem.data.description : course.description
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
        <h1 className="font-medium truncate text-white flex-1">{course.title}</h1>
        <div className="hidden md:flex items-center gap-3 w-48">
          <Progress value={progress} className="h-2" />
          <span className="text-xs font-bold">{Math.round(progress)}%</span>
        </div>
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
              <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-white/10">
                <Button
                  variant={isCurrentCompleted ? 'outline' : 'default'}
                  onClick={handleCompleteNext}
                  className={cn(
                    'gap-2',
                    isCurrentCompleted && 'text-emerald-400 border-emerald-500/50',
                  )}
                >
                  <CheckCircle2 className="w-5 h-5" />{' '}
                  {isCurrentCompleted ? 'Concluída' : 'Concluir e Próxima Aula'}
                </Button>
              </div>
              <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-white/10">
                <h2 className="text-2xl font-serif font-bold text-white mb-4">{activeTitle}</h2>
                <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{activeDesc}</p>
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="font-bold text-lg mb-4">Avalie esta aula</h3>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setMyRating(s)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={cn(
                              'w-8 h-8 transition-colors',
                              myRating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600',
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="Deixe um comentário (opcional)..."
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      className="bg-slate-950 border-white/10 text-slate-200"
                    />
                    <Button onClick={submitRating} disabled={!myRating}>
                      Enviar Avaliação
                    </Button>
                  </div>
                  {ratings.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <h4 className="font-bold text-sm text-slate-400">
                        Comentários da Comunidade
                      </h4>
                      {ratings
                        .filter((r) => r.comment)
                        .map((r) => (
                          <div key={r.id} className="bg-slate-950 p-4 rounded-lg">
                            <div className="flex justify-between mb-2">
                              <span className="font-bold text-sm">
                                {r.expand?.user?.name || 'Aluno'}
                              </span>
                              <span className="flex text-yellow-400">
                                {Array(r.rating)
                                  .fill(0)
                                  .map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-current" />
                                  ))}
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm">{r.comment}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
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
                          className={cn(
                            'text-left px-6 py-3.5 text-sm flex items-start gap-3 transition-colors border-l-2',
                            activeItem?.type === 'lesson' && activeItem.data.id === l.id
                              ? 'bg-primary/20 text-primary border-primary font-medium'
                              : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent',
                          )}
                        >
                          {completions.some((c) => c.lesson === l.id) ? (
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                          ) : (
                            <PlayCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          )}
                          <span className="line-clamp-2">{l.title}</span>
                        </button>
                      ))}
                    {quizzes
                      .filter((q) => q.module === mod.id)
                      .map((q) => (
                        <button
                          key={q.id}
                          onClick={() => setActiveItem({ type: 'quiz', data: q })}
                          className={cn(
                            'text-left px-6 py-3.5 text-sm flex items-start gap-3 transition-colors border-l-2',
                            activeItem?.type === 'quiz' && activeItem.data.id === q.id
                              ? 'bg-primary/20 text-primary border-primary font-medium'
                              : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent',
                          )}
                        >
                          <CheckSquare className="w-4 h-4 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{q.title}</span>
                        </button>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  )
}
