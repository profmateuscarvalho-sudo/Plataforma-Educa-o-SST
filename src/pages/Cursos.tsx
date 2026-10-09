import { useEffect, useState } from 'react'
import { CourseCard } from '@/components/CourseCard'
import { PageHeader } from '@/components/PageHeader'
import { getCourses } from '@/services/courses'
import { Course } from '@/types'
import { useTranslation } from 'react-i18next'

export default function Cursos() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    getCourses().then(setCourses).catch(console.error)
  }, [])

  return (
    <div className="bg-background min-h-screen pb-24">
      <PageHeader
        badge={t('nav.courses', 'Cursos')}
        title={t('cursos.title', 'Educação e formação em SST')}
        description={t(
          'cursos.subtitle',
          'Explore nossos programas de formação, desenhados por profissionais atuantes no mercado de trabalho e instituições de ensino.',
        )}
      />

      <section className="container mx-auto px-4 pt-12 max-w-6xl">
        <div className="mb-8 border-b pb-4">
          <h2 className="text-2xl font-serif font-bold text-secondary">Catálogo Completo</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {courses.length === 0 && (
            <p className="text-slate-500">Nenhum curso disponível no momento.</p>
          )}
        </div>
      </section>
    </div>
  )
}
