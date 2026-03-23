import { Course } from '@/lib/data'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, BookOpen } from 'lucide-react'

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-premium group flex flex-col h-full border-slate-100">
      <div className="relative aspect-[3/2] overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <Badge
            variant="secondary"
            className="bg-white/90 text-primary backdrop-blur-sm border-none font-semibold shadow-sm"
          >
            {course.category}
          </Badge>
        </div>
      </div>
      <CardHeader className="flex-none pb-2">
        <h3 className="font-serif text-xl font-bold line-clamp-2 leading-tight text-primary">
          {course.title}
        </h3>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{course.description}</p>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            {course.duration}
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary" />
            {course.level}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex-none border-t border-slate-50 mt-auto p-6">
        <Button
          className="w-full font-medium shadow-sm hover:shadow-md transition-all"
          variant="outline"
        >
          Ver Detalhes do Curso
        </Button>
      </CardFooter>
    </Card>
  )
}
