import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LeadForm } from '@/components/LeadForm'
import { CourseCard } from '@/components/CourseCard'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCourses } from '@/services/courses'
import { getMagazines } from '@/services/magazines'
import { Course, Magazine } from '@/types'
import pb from '@/lib/pocketbase/client'

export default function Index() {
  const [courses, setCourses] = useState<Course[]>([])
  const [featuredMag, setFeaturedMag] = useState<Magazine | null>(null)

  useEffect(() => {
    getCourses()
      .then((res) => setCourses(res.slice(0, 3)))
      .catch(console.error)

    getMagazines()
      .then((mags) => {
        const featured = mags.find((m) => m.is_featured) || mags[0]
        if (featured) setFeaturedMag(featured)
      })
      .catch(console.error)
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-secondary">
        <div className="absolute inset-0 z-0">
          <img
            src="https://img.usecurling.com/p/1920/1080?q=factory&color=black"
            alt="Background"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-transparent" />
        </div>

        <div className="container relative z-10 px-4 py-20 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary backdrop-blur-sm font-medium text-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Desenvolvimento
              Profissional SST
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
              Excelência e Liderança em <span className="text-accent">SST</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed font-light">
              Eleve sua carreira com programas educacionais premium focados em Segurança e Saúde no
              Trabalho. Metodologia inspirada nas melhores instituições do país.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white"
                asChild
              >
                <Link to="/cursos">Explorar Cursos</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg font-bold border-accent text-accent hover:bg-accent hover:text-secondary"
                asChild
              >
                <Link to="/mentorias">Agendar Mentoria</Link>
              </Button>
            </div>
          </div>

          <div
            className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <h3 className="text-2xl font-serif font-bold text-secondary mb-2">
              Cadastre no Educação SST
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              e dê um passo a mais para o seu desenvolvimento na área.
            </p>
            <LeadForm />
          </div>
        </div>
      </section>

      {featuredMag && (
        <section className="py-20 bg-slate-50 relative z-20 border-b border-slate-200">
          <div className="container px-4">
            <div className="flex flex-col md:flex-row gap-12 items-center bg-white p-8 md:p-12 rounded-3xl shadow-lg border border-slate-100">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 text-accent font-bold tracking-widest uppercase text-sm">
                  <BookOpen className="w-4 h-4" /> Revista do Mês
                </div>
                <h2 className="text-4xl font-serif font-bold text-secondary leading-tight">
                  {featuredMag.title}
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed max-w-xl">
                  {featuredMag.summary ||
                    'Confira a edição mais recente da nossa revista científica com os melhores artigos sobre Segurança e Saúde no Trabalho.'}
                </p>
                <Button size="lg" className="h-12 px-8 font-bold" asChild>
                  <Link to="/revistas">Ler Agora</Link>
                </Button>
              </div>
              <div className="w-full md:w-1/3 aspect-[3/4] relative group">
                <div className="absolute inset-0 bg-secondary/10 translate-x-4 translate-y-4 rounded-xl -z-10 transition-transform group-hover:translate-x-6 group-hover:translate-y-6"></div>
                {featuredMag.thumbnail ? (
                  <img
                    src={pb.files.getUrl(featuredMag, featuredMag.thumbnail)}
                    alt="Capa"
                    className="w-full h-full object-cover rounded-xl shadow-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-slate-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-24 bg-white relative z-20">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-serif font-bold text-secondary mb-4">
                Cursos em Destaque
              </h2>
              <p className="text-slate-600 text-lg">
                Formação contínua de alto padrão para profissionais que buscam o topo do mercado.
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80 font-bold"
              asChild
            >
              <Link to="/cursos">
                Ver todos <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
