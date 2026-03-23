import { useEffect, useState } from 'react'
import { CourseCard } from '@/components/CourseCard'
import { getCourses } from '@/services/courses'
import { Course } from '@/types'

export default function Cursos() {
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    getCourses().then(setCourses).catch(console.error)
  }, [])

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <section className="bg-secondary text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/1920/600?q=library&color=black')] opacity-20 object-cover mix-blend-luminosity" />
        <div className="container px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Educação Profissional em SST
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed font-light">
              Explore nossos programas de formação, desenhados por especialistas para o seu
              crescimento na área de Segurança e Saúde no Trabalho.
            </p>
          </div>
        </div>
      </section>

      <section className="container px-4 pt-16">
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
