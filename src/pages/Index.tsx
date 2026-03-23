import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LeadForm } from '@/components/LeadForm'
import { CourseCard } from '@/components/CourseCard'
import { COURSES, MAGAZINES } from '@/lib/data'
import { ShieldAlert, Stethoscope, Briefcase, ArrowRight, FileText } from 'lucide-react'

export default function Index() {
  const featuredCourses = COURSES.slice(0, 3)
  const recentMagazines = MAGAZINES.slice(0, 3)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://img.usecurling.com/p/1920/1080?q=university&color=green"
            alt="Campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-slate-900/30" />
        </div>

        <div className="container relative z-10 px-4 py-20 animate-fade-in-up">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent-foreground backdrop-blur-sm font-medium text-sm text-white">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Matrículas Abertas 2026.2
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
              Excelência e Liderança em <span className="text-accent italic">SST</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed font-light">
              Eleve sua carreira com programas educacionais premium focados em Segurança e Saúde no
              Trabalho. Metodologia inspirada nas melhores instituições do mundo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="h-14 px-8 text-lg font-medium shadow-premium" asChild>
                <Link to="/cursos">Explorar Cursos</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg font-medium bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                asChild
              >
                <Link to="/mentorias">Ver Mentorias Exclusivas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Quick-Select */}
      <section className="py-20 bg-slate-50 relative -mt-10 z-20 rounded-t-[3rem]">
        <div className="container px-4">
          <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-3xl font-serif font-bold text-primary mb-4">
              Áreas de Especialização
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Programas desenhados para formar os líderes do futuro na prevenção e cuidado.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Segurança do Trabalho',
                icon: ShieldAlert,
                desc: 'Engenharia, NRs e Gestão de Riscos',
                color: 'bg-emerald-50 text-emerald-700',
              },
              {
                title: 'Medicina do Trabalho',
                icon: Stethoscope,
                desc: 'Saúde Ocupacional e Ergonomia',
                color: 'bg-blue-50 text-blue-700',
              },
              {
                title: 'Gestão Estratégica',
                icon: Briefcase,
                desc: 'Liderança e Cultura de Segurança',
                color: 'bg-indigo-50 text-indigo-700',
              },
            ].map((cat, i) => (
              <Card
                key={cat.title}
                className="group cursor-pointer hover:shadow-premium transition-all duration-300 border-none bg-white hover:-translate-y-1"
              >
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div
                    className={`p-4 rounded-2xl ${cat.color} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <cat.icon className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl text-primary mb-2">{cat.title}</h3>
                    <p className="text-slate-500 text-sm">{cat.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-serif font-bold text-primary mb-4">
                Cursos em Destaque
              </h2>
              <p className="text-slate-600 text-lg">
                Formação contínua de alto padrão para profissionais que buscam o topo do mercado.
              </p>
            </div>
            <Button
              variant="ghost"
              className="group text-primary hover:text-primary/80 font-medium"
              asChild
            >
              <Link to="/cursos">
                Ver todos os cursos{' '}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
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

      {/* Magazines Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-foreground/5 skew-x-12 translate-x-32" />
        <div className="container px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium">
                <FileText className="w-4 h-4" /> Publicações
              </div>
              <h2 className="text-4xl font-serif font-bold leading-tight">
                Revista Acadêmica SST Premium
              </h2>
              <p className="text-primary-foreground/80 text-lg leading-relaxed">
                Acesse artigos científicos, estudos de caso e entrevistas com os maiores nomes da
                Segurança e Saúde no Trabalho do Brasil.
              </p>
              <Button size="lg" variant="secondary" className="mt-4" asChild>
                <Link to="/revistas">Acessar Acervo Completo</Link>
              </Button>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {recentMagazines.map((mag, i) => (
                <div
                  key={mag.id}
                  className={`group relative aspect-[3/4] rounded-lg overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 ${i === 1 ? 'sm:translate-y-8' : i === 2 ? 'sm:translate-y-16' : ''}`}
                >
                  <img
                    src={mag.image}
                    alt={mag.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <p className="text-accent font-bold text-sm mb-1">{mag.issue}</p>
                    <p className="text-white text-xs line-clamp-2 opacity-90">{mag.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lead Generation Section */}
      <section className="py-24 bg-slate-50 relative">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
            <div className="md:w-5/12 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
              <img
                src="https://img.usecurling.com/p/600/800?q=consulting&color=green"
                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
                alt="Consulting"
              />

              <div className="relative z-10 space-y-6">
                <h3 className="text-3xl font-serif font-bold">
                  Dê o Próximo Passo na sua Carreira
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Fale com um de nossos consultores educacionais para descobrir qual programa é o
                  ideal para o seu momento profissional.
                </p>
              </div>

              <div className="relative z-10 mt-12 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <span className="font-serif font-bold">1</span>
                  </div>
                  <p className="text-sm text-slate-200">Preencha seus dados</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <span className="font-serif font-bold">2</span>
                  </div>
                  <p className="text-sm text-slate-200">Receba contato especializado</p>
                </div>
              </div>
            </div>

            <div className="md:w-7/12 p-8 md:p-12">
              <h4 className="text-2xl font-bold text-primary mb-6">Solicitar Contato</h4>
              <LeadForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
