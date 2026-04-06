import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LeadForm } from '@/components/LeadForm'
import { CourseCard } from '@/components/CourseCard'
import { ArrowRight, BookOpen, Star } from 'lucide-react'
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
    <div className="flex flex-col min-h-screen relative">
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
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              &nbsp;Plataforma para profissionais e estudantes em SST
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
              Educação e desenvolvimento
              <div>
                em <span className="text-accent">SST</span>
              </div>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed font-light">
              Eleve o seu conhecimento a partir de nossos programas educacionais focados em
              Segurança e Saúde no Trabalho e construa um itinerário profissional de forma sólida
              com foco na prática e na sua realidade de trabalho.&nbsp;&nbsp;
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
              Cadastre na Educação SST
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              e dê um passo a mais para o seu desenvolvimento na área. Receba novidades e
              atualizações.
            </p>
            <LeadForm />
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 relative z-20">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-serif font-bold text-secondary mb-4">
                Cursos em Destaque
              </h2>
              <p className="text-slate-600 text-lg">
                Construa seu itinerário formativa de alto nível com foco na sua realidade e
                conhecimento prático.
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

      {/* Floating Featured Magazine Widget */}
      {featuredMag && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up max-w-[calc(100vw-2rem)]">
          <Link
            to="/revistas"
            className="group flex items-center bg-white p-3 pr-5 rounded-2xl shadow-2xl border border-slate-200 hover:border-primary/50 transition-all hover:-translate-y-1 w-full sm:w-[320px] gap-4"
          >
            <div className="w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 shadow-inner relative flex items-center justify-center">
              {featuredMag.thumbnail ? (
                <img
                  src={pb.files.getUrl(featuredMag, featuredMag.thumbnail)}
                  alt="Capa"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <BookOpen className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> Revista do Mês
              </div>
              <h4 className="font-serif font-bold text-sm text-secondary line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {featuredMag.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">Clique para ler grátis</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
