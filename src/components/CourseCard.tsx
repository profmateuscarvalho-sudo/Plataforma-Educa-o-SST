import { Course } from '@/types'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'

export function CourseCard({ course }: { course: Course }) {
  const imgUrl = course.thumbnail
    ? pb.files.getUrl(course, course.thumbnail)
    : 'https://img.usecurling.com/p/600/400?q=education&color=green'

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group flex flex-col h-full border-slate-100">
      <div className="relative aspect-[3/2] overflow-hidden">
        <img
          src={imgUrl}
          alt={course.title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/95 text-secondary font-bold shadow-sm">
            {course.category}
          </Badge>
        </div>
      </div>
      <CardHeader className="flex-none pb-2">
        <h3 className="font-serif text-xl font-bold line-clamp-2 leading-tight text-secondary group-hover:text-primary transition-colors">
          {course.title}
        </h3>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-slate-500 line-clamp-3 mb-4">{course.description}</p>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <PlayCircle className="w-4 h-4 text-primary" /> Acesso Imediato
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex-none border-t border-slate-50 mt-auto p-6 flex justify-between items-center">
        <span className="font-bold text-lg text-primary">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            course.price || 0,
          )}
        </span>
        <Button
          asChild
          variant="outline"
          className="font-medium hover:bg-primary hover:text-white border-primary text-primary transition-colors"
        >
          <Link to={`/cursos/${course.id}`}>Ver Detalhes</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
