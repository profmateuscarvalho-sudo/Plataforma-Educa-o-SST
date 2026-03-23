import { useAuth } from '@/contexts/AuthContext'
import { COURSES } from '@/lib/data'
import { Link, Navigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayCircle, Calendar, Video } from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()

  if (!user || user.role !== 'student') return <Navigate to="/login" />

  const myCourses = COURSES.slice(0, 2)

  return (
    <div className="container px-4 py-12 max-w-6xl">
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
          <h2 className="text-2xl font-bold text-secondary mb-6 border-b pb-2">Meus Cursos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myCourses.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden flex flex-col sm:flex-row border-slate-200"
              >
                <div className="w-full sm:w-48 aspect-video sm:aspect-auto shrink-0">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6 flex flex-col justify-center flex-1">
                  <h3 className="font-bold text-lg leading-tight mb-2 text-secondary">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {course.lessons.length} Aulas disponíveis
                  </p>
                  <Button asChild className="w-fit">
                    <Link to={`/aluno/curso/${course.id}/aula/${course.lessons[0].id}`}>
                      <PlayCircle className="mr-2 w-4 h-4" /> Continuar Assistindo
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-secondary mb-6 border-b pb-2">Minhas Mentorias</h2>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-secondary">Sessão Individual (1h)</h4>
                  <p className="text-sm text-slate-500">Agendado para: 15 de Novembro, 14:00</p>
                </div>
              </div>
              <Button variant="outline">
                <Video className="mr-2 w-4 h-4" /> Acessar Sala
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
