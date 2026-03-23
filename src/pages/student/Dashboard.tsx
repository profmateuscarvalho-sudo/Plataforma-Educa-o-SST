import { useAuth } from '@/hooks/use-auth'
import { Link, Navigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCourses } from '@/services/courses'
import { Course } from '@/types'
import pb from '@/lib/pocketbase/client'

export default function StudentDashboard() {
  const { user, loading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    getCourses().then(setCourses).catch(console.error)
  }, [])

  if (loading) return <div>Carregando...</div>
  if (!user || user.role !== 'student') return <Navigate to="/login" />

  return (
    <div className="container px-4 py-12 max-w-6xl min-h-[calc(100vh-80px)]">
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-bold text-secondary mb-2">
          Bem-vindo, {user.name}
        </h1>
        <p className="text-slate-500">
          Acesse seus materiais de desenvolvimento profissional em SST.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-secondary mb-6 border-b pb-2">
            Meus Cursos Adquiridos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => {
              const imgUrl = course.thumbnail
                ? pb.files.getUrl(course, course.thumbnail)
                : 'https://img.usecurling.com/p/600/400?q=education&color=green'
              return (
                <Card
                  key={course.id}
                  className="overflow-hidden flex flex-col sm:flex-row border-slate-200"
                >
                  <div className="w-full sm:w-48 aspect-video sm:aspect-auto shrink-0">
                    <img src={imgUrl} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-6 flex flex-col justify-center flex-1">
                    <h3 className="font-bold text-lg leading-tight mb-2 text-secondary">
                      {course.title}
                    </h3>
                    <Button asChild className="w-fit mt-4">
                      <Link to={`/aluno/curso/${course.id}/aula`}>
                        <PlayCircle className="mr-2 w-4 h-4" /> Acessar Plataforma
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
