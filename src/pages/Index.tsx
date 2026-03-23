import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LeadForm } from '@/components/LeadForm'
import { CourseCard } from '@/components/CourseCard'
import { COURSES, MAGAZINES } from '@/lib/data'
import { ShieldAlert, Stethoscope, Briefcase, ArrowRight, FileText } from 'lucide-react'

export default function Index() {
  const featuredCourses = COURSES.slice(0, 3)

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-secondary">
        <div className="absolute inset-0 z-0">
          <img
            src="https://img.usecurling.com/p/1920/1080?q=industry&color=black"
            alt="Background"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-transparent" />
        </div>

        <div className="container relative z-10 px-4 py-20 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary backdrop-blur-sm font-medium text-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Desenvolvimento Profissional SST
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
              Fale com um Consultor
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Descubra qual programa é o ideal para o seu momento profissional.
            </p>
            <LeadForm />
          </div>
        </div>
      </section>

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
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
