import { Course } from '@/types'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export function CourseCard({ course }: { course: Course }) {
  const imgUrl = course.thumbnail
    ? pb.files.getUrl(course, course.thumbnail)
    : 'https://img.usecurling.com/p/600/400?q=education&color=green'

  const planBadgeText = course.is_free ? 'Plano Free' : 'Plano Prata'

  return (
    <div className="bg-white rounded-[28px] border border-[#E4DED1] overflow-hidden flex flex-col h-full hover:shadow-lg transition-all duration-300 group">
      {/* Imagem */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#FAF8F3] shrink-0">
        <img
          src={imgUrl}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {course.category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-[#1C1B18] shadow-sm border border-[#E4DED1]">
              {course.category}
            </span>
          )}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
              course.is_free ? 'bg-[#FDBE2D] text-[#1C1B18]' : 'bg-[#173F33] text-[#F4F1E8]'
            }`}
          >
            {planBadgeText}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6 sm:p-7 flex flex-col flex-grow justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1C1B18] leading-tight line-clamp-2 group-hover:text-[#173F33] transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-[#5F5A4F] line-clamp-1 font-normal leading-relaxed">
            {course.description ||
              'Curso prático com foco em aplicação profissional na rotina de SST.'}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-[#E4DED1]">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#7F7869] block font-bold">
              {course.is_free ? 'Incluso' : 'Valor'}
            </span>
            <span className="font-bold text-lg sm:text-xl text-[#1C1B18]">
              {course.is_free
                ? 'Gratuito'
                : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    course.price || 0,
                  )}
            </span>
          </div>

          <Button
            asChild
            size="default"
            className="rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none h-11 px-5"
          >
            <Link to={`/cursos/${course.id}`} className="inline-flex items-center gap-1.5">
              <span>Ver curso</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
