import { useParams, Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { ChevronLeft, PlayCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { useEffect, useState } from 'react'
import { getCourse } from '@/services/courses'
import { getCourseModules, getCourseLessons, getCourseMaterials } from '@/services/curriculum'
import { Course, Module, Lesson, Material } from '@/types'
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

export default function CourseLesson() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([getCourse(id), getCourseModules(id), getCourseLessons(id), getCourseMaterials(id)])
      .then(([c, m, l, mat]) => {
        setCourse(c)
        setModules(m)
        setLessons(l)
        setMaterials(mat)
        if (l.length > 0) setCurrentLesson(l[0])
      })
      .catch(console.error)
  }, [id])

  if (loading) return null
  if (!user || user.role !== 'student') return <Navigate to="/login" />
  if (!course) return <div className="p-8 text-white">Carregando aula...</div>

  const videoId = currentLesson?.panda_video_id || course.panda_video_id
  const activeTitle = currentLesson?.title || course.title
  const activeDesc = currentLesson?.description || course.description
  const iframeUrl = getPandaUrl(videoId)

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-slate-900 text-slate-200">
      <div className="h-16 border-b border-white/10 flex items-center px-4 md:px-8 gap-4 bg-secondary shrink-0">
        <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white">
          <Link to="/aluno">
            <ChevronLeft className="mr-2 w-4 h-4" /> Voltar
          </Link>
        </Button>
        <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />
        <h1 className="font-medium truncate text-white">{course.title}</h1>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 md:p-8 gap-8 items-start">
        <div className="flex-1 w-full space-y-6">
          <div
            className="bg-black w-full rounded-xl overflow-hidden shadow-2xl relative"
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
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-slate-500">
                Vídeo não disponível
              </div>
            )}
          </div>
          <div className="bg-secondary p-6 rounded-xl border border-white/10">
            <h2 className="text-2xl font-serif font-bold text-white mb-2">{activeTitle}</h2>
            <p className="text-slate-400 whitespace-pre-wrap">{activeDesc}</p>
          </div>
        </div>

        <div className="w-full lg:w-80 shrink-0 bg-secondary rounded-xl border border-white/10 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10 font-bold text-white">Conteúdo do Curso</div>
          <Accordion type="single" collapsible defaultValue={modules[0]?.id} className="w-full">
            {modules.map((mod) => (
              <AccordionItem
                value={mod.id}
                key={mod.id}
                className="border-white/10 border-b-0 border-t first:border-t-0"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-white/5 hover:no-underline text-sm font-semibold text-slate-200 text-left">
                  {mod.title}
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="flex flex-col bg-slate-900/50">
                    {lessons
                      .filter((l) => l.module === mod.id)
                      .map((l) => (
                        <button
                          key={l.id}
                          onClick={() => setCurrentLesson(l)}
                          className={`text-left px-6 py-3 text-sm flex items-start gap-3 transition-colors ${
                            currentLesson?.id === l.id
                              ? 'bg-primary/20 text-primary border-l-2 border-primary'
                              : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                          }`}
                        >
                          <PlayCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{l.title}</span>
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
                          className="text-left px-6 py-3 text-sm flex items-start gap-3 text-slate-400 hover:text-accent hover:bg-white/5 border-l-2 border-transparent transition-colors"
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
