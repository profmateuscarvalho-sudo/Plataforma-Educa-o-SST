import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StudentHomePreview } from '@/components/StudentHomePreview'
import { LandingRegisterForm } from '@/components/LandingRegisterForm'
import { PricingSection } from '@/components/PricingSection'
import { CourseCard } from '@/components/CourseCard'
import { ArrowRight, BookOpen, Star, Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCourses } from '@/services/courses'
import { getMagazines } from '@/services/magazines'
import { getNews } from '@/services/news'
import { Course, Magazine, News } from '@/types'
import pb from '@/lib/pocketbase/client'
import { NewsCard } from '@/components/NewsCard'

export default function Index() {
  const [courses, setCourses] = useState<Course[]>([])
  const [featuredMag, setFeaturedMag] = useState<Magazine | null>(null)
  const [latestNews, setLatestNews] = useState<News[]>([])
  const [magBannerDismissed, setMagBannerDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('mag_banner_dismissed') === 'true') {
      setMagBannerDismissed(true)
    }
  }, [])

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

    getNews()
      .then((res) => setLatestNews(res.slice(0, 3)))
      .catch(console.error)
  }, [])

  return (
    <div className="flex flex-col min-h-screen relative">
      <section
        id="hero"
        className="min-h-screen flex items-center overflow-hidden bg-secondary relative pt-20 pb-8 scroll-mt-16"
      >
        <div className="absolute inset-0 z-0">
          <img
            src="https://img.usecurling.com/p/1920/1080?q=factory&color=black"
            alt="Background"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary via-secondary/90 to-secondary/80" />
        </div>

        <div className="container relative z-10 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-5 space-y-5 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary backdrop-blur-sm font-medium text-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Plataforma para profissionais e estudantes em SST
              </div>
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-serif font-bold text-white leading-tight">
                Educação e desenvolvimento em <span className="text-accent">SST</span>
              </h1>
              <p className="text-base md:text-lg text-slate-300 max-w-xl leading-relaxed font-light">
                Eleve o seu conhecimento a partir de nossos programas educacionais focados em
                Segurança e Saúde no Trabalho e construa um itinerário profissional de forma sólida
                com foco na prática e na sua realidade de trabalho.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  className="h-12 px-7 text-base font-bold bg-primary hover:bg-primary/90 text-white"
                  asChild
                >
                  <a href="#planos">Assine</a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-7 text-base font-bold border-accent text-accent hover:bg-accent hover:text-secondary"
                  asChild
                >
                  <Link to="/mentorias">Agendar Mentoria</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-primary" /> Cursos em SST
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-primary" /> Revistas científicas
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-primary" /> Documentários exclusivos
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="order-2 sm:order-1 self-center">
                <StudentHomePreview />
              </div>
              <div className="order-1 sm:order-2">
                <LandingRegisterForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 relative z-20">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-serif font-bold text-secondary mb-4">
                Cursos em Destaque
              </h2>
              <p className="text-slate-600 text-lg">
                Construa seu itinerário formativo de alto nível com foco na sua realidade e
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

      {latestNews.length > 0 && (
        <section className="py-24 bg-white relative z-20">
          <div className="container px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-serif font-bold text-secondary mb-4">
                  Últimas Notícias
                </h2>
                <p className="text-slate-600 text-lg">
                  Acompanhe as novidades e atualizações do mercado de Segurança e Saúde no Trabalho.
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-primary hover:text-primary/80 font-bold"
                asChild
              >
                <Link to="/noticias">
                  Ver todas <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestNews.map((n) => (
                <NewsCard key={n.id} news={n} />
              ))}
            </div>
          </div>
        </section>
      )}

      <PricingSection />

      {featuredMag && !magBannerDismissed && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up max-w-[calc(100vw-3rem)]">
          <button
            onClick={() => {
              setMagBannerDismissed(true)
              sessionStorage.setItem('mag_banner_dismissed', 'true')
            }}
            className="absolute -top-2 -right-2 z-10 bg-white rounded-full p-1.5 shadow-md hover:bg-slate-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
          <Link
            to="/revistas"
            className="group flex flex-col items-center bg-white p-4 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-primary/20 hover:border-primary/60 transition-all hover:-translate-y-2 w-[240px] sm:w-[280px] gap-4"
          >
            <div className="w-full aspect-[1/1.414] shrink-0 rounded-xl overflow-hidden bg-slate-100 shadow-inner relative flex items-center justify-center">
              {featuredMag.thumbnail ? (
                <img
                  src={pb.files.getUrl(featuredMag, featuredMag.thumbnail)}
                  alt="Capa"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <BookOpen className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <div className="flex flex-col items-center text-center w-full min-w-0 pb-1">
              <div className="text-xs font-bold uppercase tracking-wider text-accent mb-2 flex items-center justify-center gap-1.5">
                <Star className="w-4 h-4 fill-current text-accent" /> Revista do Mês
              </div>
              <p className="text-sm font-bold text-primary mt-1 flex items-center justify-center gap-1 w-full bg-primary/5 hover:bg-primary/10 py-2.5 rounded-lg transition-colors">
                Clique aqui para ler grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
