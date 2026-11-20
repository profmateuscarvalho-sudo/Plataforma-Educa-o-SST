import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCourseModules, getCourseLessons, getCourseMaterials } from '@/services/curriculum'
import { getCourse } from '@/services/courses'
import { Module, Lesson, Material, Course } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { useStudentAccess } from '@/hooks/use-student-access'
import { useProtectedVideo } from '@/hooks/use-protected-video'
import { LockedVideo } from '@/components/student/LockedVideo'
import { useTrackAccess } from '@/hooks/use-track-access'
import { toggleCompletion, rateLesson, getCompletions, getLessonRatings } from '@/services/student'
import pb from '@/lib/pocketbase/client'
import { cn, stripHtml } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatBRL } from '@/lib/pricing'
import { getErrorMessage } from '@/lib/form-errors'
import { toast } from '@/hooks/use-toast'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Download,
  FileText,
  PlayCircle,
  CheckCircle2,
  ShoppingCart,
  Loader2,
} from 'lucide-react'

const LESSON_ID_RE = /aula\/([^/?]+)/
const MODULE_ID_RE = /modulo\/([^/?]+)/
const COURSE_ID_RE = /curso\/([^/?]+)/

export default function CourseLesson() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const access = useStudentAccess()
  const navigate = useNavigate()

  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({})
  const [materials, setMaterials] = useState<Material[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [userRating, setUserRating] = useState(0)
  const [completionsVersion, setCompletionsVersion] = useState(0)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)

  const protectedVideo = useProtectedVideo(activeVideoId, 'lesson')

  useTrackAccess('Cursos')

  useEffect(() => {
    // Parse da URL. Formatos aceitos:
    //   /plataforma/curso/:courseId                    (só o curso)
    //   /plataforma/curso/:courseId/aula               (só o curso)
    //   /plataforma/curso/:courseId/aula/:lessonId     (aula específica)
    //   /plataforma/curso/:courseId/modulo/:moduleId   (módulo específico)
    // Formatos legados (sem o id do curso): aula/:id e modulo/:id
    const lessonMatch = pathname.match(LESSON_ID_RE)
    const moduleMatch = pathname.match(MODULE_ID_RE)
    const courseMatch = pathname.match(COURSE_ID_RE)
    const targetLessonId = lessonMatch?.[1]
    const targetModuleId = moduleMatch?.[1]
    // URL trouxe só o curso (com ou sem "/aula" no final): abrir a 1ª aula
    // não concluída (ou a 1ª aula) e normalizar a URL para /aula/:id.
    const courseOnlyId = !targetLessonId && !targetModuleId ? courseMatch?.[1] : undefined

    const load = async () => {
      setLoading(true)
      try {
        // Resolve a aula/curso a partir da URL antes de carregar tudo
        let lesson: Lesson | null = null
        if (targetLessonId) {
          try {
            lesson = await pb.collection('lessons').getOne(targetLessonId)
          } catch {
            lesson = null
          }
        }

        let courseId = courseOnlyId || ''
        if (lesson) {
          try {
            const mod = await pb.collection('modules').getOne(lesson.module)
            courseId = mod.course
          } catch {
            courseId = ''
          }
        } else if (moduleMatch?.[1]) {
          try {
            const mod = await pb.collection('modules').getOne(moduleMatch[1])
            courseId = mod.course
          } catch {
            courseId = ''
          }
        }

        const [mods, ls, ms] = await Promise.all([
          courseId ? getCourseModules(courseId) : Promise.resolve([] as Module[]),
          courseId ? getCourseLessons(courseId) : Promise.resolve([] as Lesson[]),
          courseId ? getCourseMaterials(courseId) : Promise.resolve([] as Material[]),
        ])

        // Ordena módulos e aulas
        const sortedMods = [...mods].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        const sortedLessons: Record<string, Lesson[]> = {}
        for (const m of sortedMods) {
          sortedLessons[m.id] = ls
            .filter((l) => l.module === m.id)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        }

        setModules(sortedMods)
        setLessons(sortedLessons)
        setMaterials(ms)
        if (courseId) {
          try {
            const c = await getCourse(courseId)
            setCourse(c)
          } catch {
            setCourse(null)
          }
        }

        // Seleciona a aula: a pedida na URL, a 1ª não concluída (quando a URL
        // trouxe só o curso), ou a primeira disponível
        const allLessons = sortedMods.flatMap((m) => sortedLessons[m.id] || [])
        let found: Lesson | null = null
        if (courseOnlyId) {
          let done = new Set<string>()
          if (user) {
            try {
              const cs = await getCompletions(user.id)
              done = new Set(cs.map((c) => c.lesson))
            } catch {
              done = new Set()
            }
          }
          found = allLessons.find((l) => !done.has(l.id)) || allLessons[0] || null
        } else {
          found = (lesson && allLessons.find((l) => l.id === lesson!.id)) || allLessons[0] || null
        }
        setCurrentLesson(found)
        if (found) setActiveVideoId(found.id)

        // URL chegou só com o curso: normaliza para /aula/:id via replace
        // (sem criar histórico extra). O efeito roda de novo já com a aula.
        if (courseOnlyId && found) {
          navigate(`/plataforma/curso/${courseOnlyId}/aula/${found.id}`, { replace: true })
        }
      } catch {
        setModules([])
        setLessons({})
        setMaterials([])
        setCurrentLesson(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pathname, user])

  // Conclusões e avaliações (por aluno)
  useEffect(() => {
    if (!user) return
    let vivo = true
    getCompletions(user.id)
      .then((cs) => {
        if (vivo) setCompleted(new Set(cs.map((c) => c.lesson)))
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [user, completionsVersion])

  useEffect(() => {
    if (!user || !currentLesson) return
    let vivo = true
    getLessonRatings(currentLesson.id)
      .then((rs) => {
        if (!vivo) return
        const mine = rs.find((r) => r.user === user.id)
        if (mine) setUserRating(mine.rating)
        else setUserRating(0)
        const avg = rs.length > 0 ? rs.reduce((acc, r) => acc + (r.rating || 0), 0) / rs.length : 0
        setRating(Math.round(avg))
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [user, currentLesson])

  const allLessons = modules.flatMap((m) => lessons[m.id] || [])
  const idx = currentLesson ? allLessons.findIndex((l) => l.id === currentLesson.id) : -1
  const prevLesson = idx > 0 ? allLessons[idx - 1] : null
  const nextLesson = idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null

  const selectLesson = (l: Lesson) => {
    setCurrentLesson(l)
    setActiveVideoId(l.id)
    // NÃO busca o vídeo aqui: useProtectedVideo resolve o link protegido.
  }

  const toggleComplete = async () => {
    if (!currentLesson) return
    try {
      await toggleCompletion(
        currentLesson.id,
        user!.id,
        !completed.has(currentLesson.id),
        undefined,
      )
      setCompleted((prev) => {
        const next = new Set(prev)
        if (next.has(currentLesson.id)) next.delete(currentLesson.id)
        else next.add(currentLesson.id)
        return next
      })
      setCompletionsVersion((v) => v + 1)
    } catch (err) {
      toast({ title: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const rateCurrentLesson = async (value: number) => {
    if (!currentLesson || !user) return
    const previous = userRating
    setUserRating(value)
    try {
      await rateLesson({ lesson: currentLesson.id, user: user.id, rating: value })
    } catch (err) {
      setUserRating(previous)
      toast({ title: getErrorMessage(err), variant: 'destructive' })
    }
  }

  // Acesso liberado? (tier prata/ouro ativo OU curso gratuito OU curso comprado)
  const canAccess = () => {
    if (user?.role === 'admin') return true
    if (access.activeTier === 'prata' || access.activeTier === 'ouro') return true
    if (course?.is_free) return true
    return false
  }

  const cursoLiberado = canAccess()

  const handleBuyCourse = async () => {
    if (!course) return
    setPurchaseLoading(true)
    try {
      // Fluxo de compra avulsa do curso usa CheckoutModal no card de detalhe.
      // Aqui redireciona para a página de detalhes, que tem o fluxo de checkout.
      window.location.href = `/cursos/${course.id}`
    } catch (err) {
      toast({ title: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setPurchaseLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando aula...</div>
      </div>
    )
  }

  if (!course || allLessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Nenhuma aula disponível para este curso.</p>
          <Button variant="outline" asChild>
            <Link to="/plataforma">Voltar ao Hub</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/plataforma">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{course?.title || 'Curso'}</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentLesson ? stripHtml(currentLesson.title) : 'Selecione uma aula'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/plataforma">Hub de estudos</Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Conteúdo principal */}
        <div className="space-y-4">
          {/* Player / bloqueio */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
            {protectedVideo.unlocked && protectedVideo.video?.url ? (
              <iframe
                src={protectedVideo.video.url}
                className="w-full h-full"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                title={currentLesson?.title || 'Aula'}
              />
            ) : protectedVideo.loading || (activeVideoId && protectedVideo.video === null) ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : cursoLiberado && !activeVideoId ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Selecione uma aula</p>
                </div>
              </div>
            ) : (
              <LockedVideo
                message={
                  cursoLiberado
                    ? 'Vídeo desta aula não disponível. Tente novamente mais tarde.'
                    : 'Esta aula faz parte de um curso pago. Assine o plano Prata para assistir.'
                }
              />
            )}
          </div>

          {/* Título da aula + conclusão */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-serif font-semibold">
                {currentLesson ? stripHtml(currentLesson.title) : 'Aula'}
              </h1>
              {currentLesson?.description && (
                <div
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: currentLesson.description }}
                />
              )}
            </div>
            <Button
              variant={completed.has(currentLesson?.id || '') ? 'default' : 'outline'}
              size="sm"
              onClick={toggleComplete}
              className="shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {completed.has(currentLesson?.id || '') ? 'Concluída' : 'Marcar como concluída'}
            </Button>
          </div>

          {/* Avaliação da aula */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Avalie esta aula:</span>
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => rateCurrentLesson(v)} aria-label={`${v} estrelas`}>
                <Star
                  className={cn(
                    'w-5 h-5 transition-colors',
                    v <= (userRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground',
                  )}
                />
              </button>
            ))}
          </div>

          {/* Materiais de apoio */}
          {materials.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Materiais de apoio
              </h2>
              {materials.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm truncate">{stripHtml(m.title)}</span>
                  </div>
                  {m.file ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={pb.files.getUrl(m, m.file)} target="_blank" rel="noreferrer">
                        <Download className="w-4 h-4 mr-1" /> Baixar
                      </a>
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: módulos e aulas */}
        <aside className="space-y-3">
          <Progress
            value={
              allLessons.length > 0
                ? Math.round(
                    (allLessons.filter((l) => completed.has(l.id)).length / allLessons.length) *
                      100,
                  )
                : 0
            }
          />
          <p className="text-xs text-muted-foreground text-right">
            {allLessons.filter((l) => completed.has(l.id)).length}/{allLessons.length} aulas
            concluídas
          </p>

          {!cursoLiberado && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
              <p className="text-sm">
                Este é um curso pago. Assine o plano Prata ou compre o curso avulso para acessar
                todas as aulas.
              </p>
              <Button className="w-full" onClick={handleBuyCourse} disabled={purchaseLoading}>
                {purchaseLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                {course?.price ? `Comprar por ${formatBRL(course.price)}` : 'Ver opções de acesso'}
              </Button>
            </div>
          )}

          <Accordion
            type="single"
            collapsible
            defaultValue={currentLesson?.module || modules[0]?.id}
          >
            {modules.map((m) => (
              <AccordionItem key={m.id} value={m.id}>
                <AccordionTrigger className="text-sm font-semibold">
                  {stripHtml(m.title)}
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {(lessons[m.id] || []).map((l) => {
                    const active = currentLesson?.id === l.id
                    return (
                      <button
                        key={l.id}
                        onClick={() => selectLesson(l)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors',
                          active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
                        )}
                      >
                        {completed.has(l.id) ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <PlayCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate">{stripHtml(l.title)}</span>
                      </button>
                    )
                  })}
                  {(lessons[m.id] || []).length === 0 && (
                    <p className="text-xs text-muted-foreground px-3 py-1">Nenhuma aula.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </aside>
      </div>

      {/* Navegação inferior */}
      <div className="container mx-auto px-4 pb-10 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={!prevLesson}
          onClick={() => prevLesson && selectLesson(prevLesson)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        <Button
          variant="outline"
          disabled={!nextLesson}
          onClick={() => nextLesson && selectLesson(nextLesson)}
        >
          Próxima <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
