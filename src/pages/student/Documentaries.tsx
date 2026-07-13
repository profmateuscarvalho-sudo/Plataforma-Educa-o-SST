import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDocProjects } from '@/services/doc_projects'
import { DocProject } from '@/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Info, Lock } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Logo } from '@/components/ui/Logos'
import { Badge } from '@/components/ui/badge'

export default function StudentDocumentaries() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState<DocProject[]>([])

  useEffect(() => {
    getDocProjects()
      .then(setProjects)
      .catch(() => {})
  }, [])

  const userTier = user?.role === 'admin' ? 'ouro' : user?.plan_tier || 'free'
  const hasPaidAccess = userTier !== 'free' || user?.role === 'admin'
  const canWatch = (p: DocProject) => p.is_free || hasPaidAccess

  const featured = projects[0]

  const getCover = (p: DocProject) =>
    p.presentation_photos?.length
      ? pb.files.getUrl(p, p.presentation_photos[0])
      : `https://img.usecurling.com/p/800/500?q=documentary`

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden pb-20">
      <div className="absolute top-6 left-6 z-50 flex items-center gap-6">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/20 px-4 h-10 rounded-full bg-black/30 backdrop-blur border border-white/10"
          onClick={() => navigate('/plataforma')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Hub
        </Button>
        <Logo className="text-white drop-shadow-md hidden sm:block" />
      </div>

      {featured && (
        <div className="relative h-[85vh] w-full flex items-center">
          {!canWatch(featured) && (
            <div className="absolute top-20 left-6 z-30 flex items-center gap-2 bg-amber-500/90 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur">
              <Lock className="w-4 h-4" /> Conteúdo Exclusivo — Faça Upgrade
            </div>
          )}
          <div className="absolute inset-0">
            <img
              src={getCover(featured)}
              alt={featured.title}
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/50 to-transparent" />
          </div>
          <div className="relative z-10 container px-8 md:px-16 max-w-5xl mx-0">
            {featured.is_free && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 mb-4 text-xs font-bold uppercase tracking-widest px-3 py-1">
                Acesso Liberado
              </Badge>
            )}
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-4 drop-shadow-2xl">
              {featured.title}
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 mb-8 line-clamp-3 max-w-2xl text-shadow font-light">
              {featured.description}
            </p>
            <div className="flex flex-wrap gap-4">
              {canWatch(featured) ? (
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-zinc-200 text-lg font-bold px-8 h-14 rounded-full"
                  asChild
                >
                  <Link to={`/plataforma/documentarios/${featured.id}`}>
                    <Play className="w-5 h-5 mr-2 fill-current" /> Assistir Agora
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="bg-amber-500 text-black hover:bg-amber-400 text-lg font-bold px-8 h-14 rounded-full"
                  asChild
                >
                  <Link to="/planos">
                    <Lock className="w-5 h-5 mr-2" /> Faça Upgrade para Assistir
                  </Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="bg-zinc-800/60 border-zinc-500/50 text-white hover:bg-zinc-700/80 text-lg px-8 h-14 rounded-full backdrop-blur-sm"
                asChild
              >
                <Link to={`/plataforma/documentarios/${featured.id}`}>
                  <Info className="w-5 h-5 mr-2" /> Mais Detalhes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-20 -mt-16 sm:-mt-24 space-y-12">
        <div className="px-8 md:px-16">
          <h2 className="text-2xl font-bold mb-6 text-zinc-100 flex items-center gap-2">
            Adicionados Recentemente
          </h2>
          <Carousel opts={{ align: 'start', loop: false }} className="w-full">
            <CarouselContent className="-ml-4 pb-8 pt-4">
              {projects.map((p) => (
                <CarouselItem
                  key={p.id}
                  className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                >
                  <Link
                    to={`/plataforma/documentarios/${p.id}`}
                    className="group relative block aspect-video rounded-xl overflow-hidden bg-zinc-800 transition-all hover:scale-105 hover:z-30 duration-500 border border-zinc-800 hover:border-zinc-500 hover:shadow-2xl hover:shadow-black/50"
                  >
                    <img
                      src={getCover(p)}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                    {!canWatch(p) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}

                    {canWatch(p) && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-50 group-hover:scale-100">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur border border-white/40 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-0 inset-x-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="font-bold text-sm text-white line-clamp-1">{p.title}</h3>
                      {p.is_free ? (
                        <p className="text-xs text-emerald-400 font-medium mt-1">Acesso Liberado</p>
                      ) : canWatch(p) ? (
                        <p className="text-xs text-zinc-300 font-medium mt-1">Disponível</p>
                      ) : (
                        <p className="text-xs text-amber-400 font-medium mt-1">Acesso Restrito</p>
                      )}
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-black/50 border-white/20 hover:bg-black text-white w-12 h-12" />
            <CarouselNext className="right-4 bg-black/50 border-white/20 hover:bg-black text-white w-12 h-12" />
          </Carousel>
        </div>
      </div>
    </div>
  )
}
