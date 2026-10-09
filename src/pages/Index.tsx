import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from 'react-i18next'
import { StudentHomePreview } from '@/components/StudentHomePreview'
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
import { BannerDisplay } from '@/components/BannerDisplay'

export default function Index() {
  const [courses, setCourses] = useState<Course[]>([])
  const [featuredMag, setFeaturedMag] = useState<Magazine | null>(null)
  const [latestNews, setLatestNews] = useState<News[]>([])
  const [magBannerDismissed, setMagBannerDismissed] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    if (sessionStorage.getItem('mag_banner_dismissed') === 'true') {
      setMagBannerDismissed(true)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user && user.role === 'student') {
      navigate('/plataforma', { replace: true })
    }
  }, [user, authLoading, navigate])

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'pt-BR'

  useEffect(() => {
    getCourses()
      .then((res) => setCourses(res.slice(0, 3)))
      .catch(console.error)

    getMagazines({ language: currentLang })
      .then((mags) => {
        const featured = mags.find((m) => m.is_featured) || mags[0]
        setFeaturedMag(featured || null)
      })
      .catch(console.error)

    getNews()
      .then((res) => setLatestNews(res.slice(0, 3)))
      .catch(console.error)
  }, [currentLang])

  return (
    <div className="flex flex-col min-h-screen relative">
      <BannerDisplay location="Home - Topo" className="px-4 pt-4 max-w-[88rem] mx-auto" />
      <section
        id="hero"
        className="min-h-screen flex items-center overflow-hidden bg-background relative pt-12 pb-8 scroll-mt-16 border-b border-border"
      >
        <div className="container relative z-10 px-4 max-w-[88rem] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-5 animate-hero-in">
              <div>
                <span className="label-overline">{t('hero.badge')}</span>
              </div>
              <h1 className="title-h1-home text-foreground">
                {t('hero.title')} <em>{t('hero.titleHighlight')}</em>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed font-normal">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button size="lg" className="h-12 px-7 text-base font-bold shadow-none" asChild>
                  <Link to="/register">{t('hero.ctaFree')}</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-7 text-base font-bold"
                  asChild
                >
                  <a href="#planos">{t('hero.ctaPlans')}</a>
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                  <Check className="w-4 h-4 text-primary" /> {t('hero.featureCourses')}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                  <Check className="w-4 h-4 text-primary" /> {t('hero.featureMagazines')}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                  <Check className="w-4 h-4 text-primary" /> {t('hero.featureDocumentaries')}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 flex items-center justify-center">
              <div className="w-full max-w-md sm:max-w-lg lg:max-w-2xl xl:max-w-3xl">
                <StudentHomePreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="py-20 bg-slate-50 relative z-20">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-serif font-bold text-secondary mb-4">
                {t('home.featuredCourses')}
              </h2>
              <p className="text-slate-600 text-lg">{t('home.featuredCoursesDesc')}</p>
            </div>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80 font-bold"
              asChild
            >
              <Link to="/cursos">
                {t('home.viewAll')} <ArrowRight className="ml-2 w-4 h-4" />
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

      <BannerDisplay location="Home - Meio" className="py-8 container px-4" />

      {latestNews.length > 0 && (
        <section className="py-24 bg-white relative z-20">
          <div className="container px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-serif font-bold text-secondary mb-4">
                  {t('home.latestNews')}
                </h2>
                <p className="text-slate-600 text-lg">{t('home.latestNewsDesc')}</p>
              </div>
              <Button
                variant="ghost"
                className="text-primary hover:text-primary/80 font-bold"
                asChild
              >
                <Link to="/noticias">
                  {t('home.viewAll')} <ArrowRight className="ml-2 w-4 h-4" />
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

      {featuredMag && !magBannerDismissed && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up max-w-[calc(100vw-3rem)]">
          <button
            onClick={() => {
              setMagBannerDismissed(true)
              sessionStorage.setItem('mag_banner_dismissed', 'true')
            }}
            className="absolute -top-2 -right-2 z-10 bg-white rounded-full p-1.5 shadow-md hover:bg-slate-100 transition-colors"
            aria-label={t('home.close')}
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
                <Star className="w-4 h-4 fill-current text-accent" /> {t('home.magazineOfMonth')}
              </div>
              <p className="text-sm font-bold text-primary mt-1 flex items-center justify-center gap-1 w-full bg-primary/5 hover:bg-primary/10 py-2.5 rounded-lg transition-colors">
                {t('home.clickToReadFree')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
