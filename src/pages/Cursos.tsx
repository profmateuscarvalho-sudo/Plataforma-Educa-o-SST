import { useEffect, useState } from 'react'
import { CourseCard } from '@/components/CourseCard'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { WaitlistModal } from '@/components/WaitlistModal'
import { getCourses } from '@/services/courses'
import { Course } from '@/types'
import { useTranslation } from 'react-i18next'
import { BookOpen, Sparkles } from 'lucide-react'

export default function Cursos() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-[#FAF8F3] min-h-screen pb-24 text-[#1C1B18]">
      <PageHeader
        badge={t('nav.courses', 'Cursos')}
        title={t('cursos.title', 'Educação e formação em SST')}
        description={t(
          'cursos.subtitle',
          'Explore nossos programas de formação, desenhados por profissionais atuantes no mercado de trabalho e instituições de ensino.',
        )}
      />

      <section className="container mx-auto px-6 pt-12 max-w-[1200px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[28px] border border-[#E4DED1] p-6 h-96 animate-pulse"
              />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div>
            <div className="mb-8 border-b border-[#E4DED1] pb-4 flex items-center justify-between">
              <div>
                <span className="label-overline">CATÁLOGO DE FORMAÇÕES</span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1B18] mt-1">
                  Cursos Disponíveis
                </h2>
              </div>
              <span className="text-sm text-[#7F7869] font-medium">
                {courses.length} {courses.length === 1 ? 'curso' : 'cursos'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        ) : (
          /* Sem cursos publicados: bloco central especificado */
          <div className="max-w-2xl mx-auto my-12 bg-white rounded-[28px] p-8 sm:p-14 text-center border border-[#E4DED1] shadow-[0_16px_36px_rgba(28,27,24,0.06)] animate-fade-in-up">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F3] border border-[#E4DED1] flex items-center justify-center text-[#1C1B18] mb-6">
              <BookOpen className="w-8 h-8 text-[#173F33]" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF8F3] text-[#7F7869] border border-[#E4DED1] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#FDBE2D]" />
              Novas turmas em preparação
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1B18] mb-4">
              Os primeiros cursos estão a caminho.
            </h2>

            <p className="text-base sm:text-lg text-[#5F5A4F] leading-relaxed mb-8 max-w-lg mx-auto font-normal">
              Estamos finalizando formações práticas orientadas à rotina de SST. Deixe seu contato
              para ter acesso prioritário e condições especiais na abertura.
            </p>

            <Button
              size="lg"
              className="h-12 px-8 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none text-base"
              onClick={() => setWaitlistOpen(true)}
            >
              Avise-me quando abrir
            </Button>
          </div>
        )}
      </section>

      {/* Modal de Lista de Espera reutilizável */}
      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        plano="cursos"
        title="Cursos Educação SST"
        description="Cadastre seu nome e e-mail para receber a data oficial de lançamento e condições exclusivas de abertura dos cursos."
        successMessage="Interesse nos cursos registrado! Assim que abrirmos as matrículas, você receberá o convite prioritário por e-mail."
      />
    </div>
  )
}
