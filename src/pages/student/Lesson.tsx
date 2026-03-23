import { useParams, Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { getCourse } from '@/services/courses'
import { Course } from '@/types'

export default function CourseLesson() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)

  useEffect(() => {
    if (id) getCourse(id).then(setCourse).catch(console.error)
  }, [id])

  if (loading) return null
  if (!user || user.role !== 'student') return <Navigate to="/login" />
  if (!course) return <div className="p-8 text-white">Carregando aula...</div>

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

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 md:p-8">
        <div
          className="bg-black w-full rounded-xl overflow-hidden shadow-2xl relative"
          style={{ paddingTop: '56.25%' }}
        >
          <iframe
            src={`https://player-vz-c2b2b8c9-251.tv.pandavideo.com.br/embed/?v=${course.panda_video_id || 'dummy'}`}
            title="Panda Video Player"
            className="absolute top-0 left-0 w-full h-full border-none"
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="mt-8 bg-secondary p-6 rounded-xl border border-white/10">
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Visão Geral do Curso</h2>
          <p className="text-slate-400">{course.description}</p>
        </div>
      </div>
    </div>
  )
}
