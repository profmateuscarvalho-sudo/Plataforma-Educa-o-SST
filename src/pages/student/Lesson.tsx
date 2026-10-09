import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useStudentAccess } from '@/hooks/use-student-access'
import {
  ChevronLeft,
  PlayCircle,
  FileText,
  CheckSquare,
  Star,
  CheckCircle2,
  Lock,
} from 'lucide-react'
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
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { hasAccess } = useStudentAccess()
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
  if (!course)
    return (
      <div className="p-8 text-muted-foreground min-h-[calc(100vh-64px)] flex items-center justify-center font-medium">
        Carregando aula...
      </div>
    )

  const courseAccess = hasAccess({ is_free: course.is_free, title: course.title })
  if (user.role === 'student' && !courseAccess) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background text-foreground items-center justify-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2 text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md text-sm">
          Este curso é exclusivo para assinantes ou requer compra individual para ser acessado.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/planos')}
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold min-h-[52px] px-6"
          >
            Ver Planos de Assinatura
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/cursos/${course.id}`)}
            className="rounded-full border-[1.5px] border-foreground text-foreground hover:bg-muted min-h-[52px] px-6 font-semibold"
          >
            Comprar Curso
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/plataforma')}
            className="rounded-full text-muted-foreground hover:text-foreground min-h-[52px] px-6"
          >
            Voltar ao Hub
          </Button>
        </div>
      </div>
    )
  }

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
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background text-foreground">
      {/* Top bar de navegação do player */}
      <div className="h-16 border-b border-border flex items-center px-4 md:px-8 gap-4 bg-card shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(user.role === 'admin' ? '/admin/cursos' : '/plataforma')}
          className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <ChevronLeft className="mr-1.5 w-4 h-4" /> Voltar
        </Button>
        <div className="h-5 w-px bg-border mx-1 hidden md:block" />
        <h1 className="font-serif font-bold text-base md:text-lg truncate text-foreground flex-1">
          {course.title}
        </h1>
        <div className="hidden md:flex items-center gap-3 w-48">
          <Progress value={progress} className="h-2 bg-muted [&>div]:bg-primary" />
          <span className="text-xs font-semibold text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full p-4 md:p-8 gap-8 items-start">
        <div className="flex-1 w-full space-y-6">
          {activeItem?.type === 'quiz' ? (
            <QuizPlayer quiz={activeItem.data} />
          ) : (
            <>
              {/* Moldura do vídeo com border-radius 28px */}
              <div
                className="bg-black w-full rounded-[28px] overflow-hidden shadow-xl relative border border-border"
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
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm font-medium">
                    Vídeo não disponível
                  </div>
                )}
              </div>

              {/* Barra de ação: Concluir e próxima aula */}
              <div className="flex justify-between items-center bg-card p-4 rounded-[28px] border border-border">
                <Button
                  onClick={handleCompleteNext}
                  className={cn(
                    'rounded-full font-bold gap-2 min-h-[52px] px-6 transition-all',
                    isCurrentCompleted
                      ? 'bg-muted text-success border border-success/40 hover:bg-muted/80'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground',
                  )}
                >
                  <CheckCircle2 className="w-5 h-5" />{' '}
                  {isCurrentCompleted ? 'Concluída' : 'Concluir e Próxima Aula'}
                </Button>
              </div>

              {/* Informações da aula e avaliações */}
              <div className="bg-card p-6 md:p-8 rounded-[28px] border border-border text-card-foreground">
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">
                  {activeTitle}
                </h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm">
                  {activeDesc || 'Sem descrição cadastrada para esta aula.'}
                </p>

                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="font-serif font-bold text-lg mb-4 text-foreground">
                    Avalie esta aula
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setMyRating(s)}
                          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-1"
                          aria-label={`Nota ${s}`}
                        >
                          <Star
                            className={cn(
                              'w-7 h-7 transition-colors',
                              myRating >= s
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground/40',
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="Deixe um comentário (opcional)..."
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      className="bg-background border-border text-foreground rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <Button
                      onClick={submitRating}
                      disabled={!myRating}
                      className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold min-h-[52px] px-6 disabled:opacity-50"
                    >
                      Enviar Avaliação
                    </Button>
                  </div>

                  {ratings.length > 0 && (
                    <div className="mt-8 space-y-3">
                      <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-muted-foreground">
                        Comentários da Comunidade
                      </h4>
                      {ratings
                        .filter((r) => r.comment)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="bg-muted/40 p-4 rounded-2xl border border-border"
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-semibold text-xs text-foreground">
                                {r.expand?.user?.name || 'Aluno'}
                              </span>
                              <span className="flex text-primary">
                                {Array(r.rating)
                                  .fill(0)
                                  .map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                  ))}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              {r.comment}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Barra lateral de módulos / aulas */}
        <div className="w-full lg:w-80 shrink-0 bg-card rounded-[28px] border border-border overflow-hidden flex flex-col text-card-foreground">
          <div className="p-5 border-b border-border font-serif font-bold text-foreground">
            Conteúdo do Curso
          </div>
          <Accordion type="single" collapsible defaultValue={modules[0]?.id} className="w-full">
            {modules.map((mod) => (
              <AccordionItem
                value={mod.id}
                key={mod.id}
                className="border-border border-b-0 border-t first:border-t-0"
              >
                <AccordionTrigger className="px-5 py-4 hover:bg-muted/50 hover:no-underline text-sm font-semibold text-foreground text-left">
                  {mod.title}
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="flex flex-col bg-muted/20">
                    {lessons
                      .filter((l) => l.module === mod.id)
                      .map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setActiveItem({ type: 'lesson', data: l })}
                          className={cn(
                            'text-left px-6 py-3.5 text-xs sm:text-sm flex items-start gap-3 transition-colors border-l-2',
                            activeItem?.type === 'lesson' && activeItem.data.id === l.id
                              ? 'bg-primary/15 text-foreground border-primary font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent',
                          )}
                        >
                          {completions.some((c) => c.lesson === l.id) ? (
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-success" />
                          ) : (
                            <PlayCircle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                          )}
                          <span className="line-clamp-2">{l.title}</span>
                        </button>
                      ))}
                    {quizzes
                      .filter((q) => q.module === mod.id)
                      .map((q) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setActiveItem({ type: 'quiz', data: q })}
                          className={cn(
                            'text-left px-6 py-3.5 text-xs sm:text-sm flex items-start gap-3 transition-colors border-l-2',
                            activeItem?.type === 'quiz' && activeItem.data.id === q.id
                              ? 'bg-primary/15 text-foreground border-primary font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent',
                          )}
                        >
                          <CheckSquare className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
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
