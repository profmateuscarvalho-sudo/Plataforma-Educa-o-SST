import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDocProjects } from '@/services/doc_projects'
import { DocProject } from '@/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Info, Lock } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useTrackAccess } from '@/hooks/use-track-access'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Logo, SquareLogo } from '@/components/ui/Logos'
import { Badge } from '@/components/ui/badge'

export default function StudentDocumentaries() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState<DocProject[]>([])
  const [coverIndex, setCoverIndex] = useState(0)

  useTrackAccess('Documentários')

  useEffect(() => {
    getDocProjects()
      .then(setProjects)
      .catch(() => {})
  }, [])

  // Sorteio inicial baseado no dia — cada acesso ao catálogo pode começar de
  // um documentário diferente, distribuindo as capas entre os alunos.
  useEffect(() => {
    if (projects.length > 1) {
      const seed = Math.floor(Date.now() / 86_400_000) // muda por dia
      setCoverIndex(seed % projects.length)
    }
  }, [projects])

  // Rotação automática das capas a cada 8 segundos, alternando circularmente
  // entre todos os documentários disponíveis. Só acontece quando há mais de
  // um documentário carregado. Depende do array `projects` (e não apenas de
  // `.length`) para que o closure do intervalo sempre enxergue a lista atual.
  useEffect(() => {
    if (projects.length <= 1) return
    const interval = setInterval(() => {
      setCoverIndex((prev) => (prev + 1) % projects.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [projects])

  const userTier = user?.role === 'admin' ? 'ouro' : user?.plan_tier || 'free'
  const hasPaidAccess = userTier !== 'free' || user?.role === 'admin'
  const canWatch = (p: DocProject) => p.is_free || hasPaidAccess

  const featured = projects[coverIndex] || projects[0]
  const getCover = (p: DocProject) =>
    p.presentation_photos?.length
      ? pb.files.getUrl(p, p.presentation_photos[0])
      : `https://img.usecurling.com/p/800/500?q=documentary`

  const handleLockedClick = () => navigate('/planos')

  const handleSelectDoc = (p: DocProject) => {
    if (!canWatch(p)) {
      handleLockedClick()
      return
    }
    navigate(`/plataforma/documentarios/${p.id}`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden pb-20">
      <div className="absolute top-6 left-6 z-50 flex items-center gap-6">
        <Button
          variant="ghost"
          className="text-foreground hover:bg-muted px-4 min-h-[44px] rounded-full bg-card/80 backdrop-blur border border-border"
          onClick={() => navigate('/plataforma')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Hub
        </Button>
        <div className="hidden sm:flex items-center gap-2.5">
          <SquareLogo variant="yellow" className="w-8 h-8" />
          <Logo className="text-foreground" />
        </div>
      </div>

      {featured && (
        <div className="relative min-h-[75vh] md:h-[85vh] w-full flex items-center">
          {!canWatch(featured) && (
            <div className="absolute top-20 left-6 z-30 flex items-center gap-2 bg-[#FAE7E1] text-[#B4472E] dark:bg-[#B4472E]/30 dark:text-[#FAE7E1] border border-[#B4472E]/30 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur">
              <Lock className="w-4 h-4" /> Conteúdo Exclusivo — Faça Upgrade
            </div>
          )}
          <div className="absolute inset-0">
            <img
              src={getCover(featured)}
              alt={featured.title}
              className="w-full h-full object-cover opacity-40 dark:opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          </div>
          <div className="relative z-10 container px-6 md:px-16 max-w-5xl mx-0 pt-20 md:pt-0">
            {featured.is_free && (
              <Badge className="bg-[#E3F1E9] text-[#1F6B4A] dark:bg-[#1F6B4A]/30 dark:text-[#E3F1E9] border border-[#1F6B4A]/30 mb-4 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                Acesso Liberado
              </Badge>
            )}
            <h1 className="text-4xl md:text-6xl font-serif font-semibold tracking-tight mb-4 text-foreground">
              {featured.title}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 line-clamp-3 max-w-2xl font-normal leading-relaxed">
              {featured.description}
            </p>
            <div className="flex flex-wrap gap-4">
              {canWatch(featured) ? (
                <>
                  <Button
                    className="min-h-[52px] px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    onClick={() => handleSelectDoc(featured)}
                  >
                    <Play className="w-5 h-5 mr-2 fill-current" /> Assistir Agora
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-[52px] px-8 rounded-full border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-muted font-semibold"
                    asChild
                  >
                    <Link to={`/plataforma/documentarios/${featured.id}`}>
                      <Info className="w-5 h-5 mr-2" /> Mais Detalhes
                    </Link>
                  </Button>
                </>
              ) : (
                <Button
                  className="min-h-[52px] px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  onClick={handleLockedClick}
                >
                  <Lock className="w-5 h-5 mr-2" /> Faça Upgrade para Assistir
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-20 -mt-10 sm:-mt-16 space-y-12">
        <div className="px-6 md:px-16">
          <h2 className="text-xl md:text-2xl font-serif font-semibold mb-6 text-foreground">
            Adicionados Recentemente
          </h2>
          <Carousel opts={{ align: 'start', loop: false }} className="w-full">
            <CarouselContent className="-ml-4 pb-8 pt-4">
              {projects.map((p) => {
                const accessible = canWatch(p)
                const cardContent = (
                  <>
                    <img
                      src={getCover(p)}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {!accessible && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Lock className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                    {accessible && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <h3 className="font-serif font-semibold text-sm text-white line-clamp-1">
                        {p.title}
                      </h3>
                      {p.is_free ? (
                        <p className="text-xs text-[#E3F1E9] font-medium mt-1">Acesso Liberado</p>
                      ) : accessible ? (
                        <p className="text-xs text-white/80 font-medium mt-1">Disponível</p>
                      ) : (
                        <p className="text-xs text-primary font-medium mt-1">Acesso Restrito</p>
                      )}
                    </div>
                  </>
                )
                return (
                  <CarouselItem
                    key={p.id}
                    className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                  >
                    <button
                      onClick={() => handleSelectDoc(p)}
                      className="group relative block w-full aspect-video rounded-[24px] overflow-hidden bg-card border border-border text-left hover:border-foreground/30 transition-all"
                    >
                      {cardContent}
                    </button>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <CarouselPrevious className="left-4 rounded-full border-border bg-card text-foreground hover:bg-muted w-11 h-11" />
            <CarouselNext className="right-4 rounded-full border-border bg-card text-foreground hover:bg-muted w-11 h-11" />
          </Carousel>
        </div>
      </div>
    </div>
  )
}
