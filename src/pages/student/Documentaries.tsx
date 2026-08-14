import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDocProjects } from '@/services/doc_projects'
import { DocProject } from '@/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Info, Lock, X, Film } from 'lucide-react'
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
import { Logo } from '@/components/ui/Logos'
import { Badge } from '@/components/ui/badge'

const getPandaUrl = (val?: string) => {
  if (!val) return ''
  if (val.includes('<iframe') || val.includes('src="')) {
    const m = val.match(/src="([^"]+)"/)
    return m ? m[1] : ''
  }
  if (val.startsWith('http')) return val
  return `https://player-vz-c2b2b8c9-251.tv.pandavideo.com.br/embed/?v=${val}`
}

const getYoutubeEmbedUrl = (url?: string) => {
  if (!url) return ''
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : url
}

export default function StudentDocumentaries() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState<DocProject[]>([])
  const [selected, setSelected] = useState<DocProject | null>(null)
  const [playing, setPlaying] = useState(false)
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

  const openCard = (p: DocProject) => {
    if (!canWatch(p)) {
      handleLockedClick()
      return
    }
    setSelected(p)
    setPlaying(false)
  }

  const videoUrl = selected
    ? getYoutubeEmbedUrl(selected.youtube_url) || getPandaUrl(selected.panda_video_id)
    : ''

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
            <p className="text-lg md:text-xl text-zinc-300 mb-8 line-clamp-3 max-w-2xl font-light">
              {featured.description}
            </p>
            <div className="flex flex-wrap gap-4">
              {canWatch(featured) ? (
                <>
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-zinc-200 text-lg font-bold px-8 h-14 rounded-full"
                    onClick={() => openCard(featured)}
                  >
                    <Play className="w-5 h-5 mr-2 fill-current" /> Assistir Agora
                  </Button>
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
                </>
              ) : (
                <Button
                  size="lg"
                  className="bg-amber-500 text-black hover:bg-amber-400 text-lg font-bold px-8 h-14 rounded-full"
                  onClick={handleLockedClick}
                >
                  <Lock className="w-5 h-5 mr-2" /> Faça Upgrade para Assistir
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-20 -mt-16 sm:-mt-24 space-y-12">
        <div className="px-8 md:px-16">
          <h2 className="text-2xl font-bold mb-6 text-zinc-100">Adicionados Recentemente</h2>
          <Carousel opts={{ align: 'start', loop: false }} className="w-full">
            <CarouselContent className="-ml-4 pb-8 pt-4">
              {projects.map((p) => {
                const accessible = canWatch(p)
                const cardContent = (
                  <>
                    <img
                      src={getCover(p)}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    {!accessible && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    {accessible && (
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
                      ) : accessible ? (
                        <p className="text-xs text-zinc-300 font-medium mt-1">Disponível</p>
                      ) : (
                        <p className="text-xs text-amber-400 font-medium mt-1">Acesso Restrito</p>
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
                      onClick={() => openCard(p)}
                      className={`group relative block w-full aspect-video rounded-xl overflow-hidden bg-zinc-800 transition-all hover:scale-105 hover:z-30 duration-500 border text-left ${
                        accessible
                          ? 'border-zinc-800 hover:border-zinc-500 hover:shadow-2xl hover:shadow-black/50'
                          : 'border-zinc-800 hover:border-amber-600/50 hover:shadow-2xl hover:shadow-black/50'
                      }`}
                    >
                      {cardContent}
                    </button>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-black/50 border-white/20 hover:bg-black text-white w-12 h-12" />
            <CarouselNext className="right-4 bg-black/50 border-white/20 hover:bg-black text-white w-12 h-12" />
          </Carousel>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <button
            onClick={() => {
              setSelected(null)
              setPlaying(false)
            }}
            className="absolute top-5 right-5 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative w-full max-w-5xl bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Tela principal: thumbnail / player */}
            <div className="relative aspect-video bg-black">
              {playing && videoUrl ? (
                <iframe
                  src={videoUrl}
                  className="w-full h-full border-none"
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen"
                  allowFullScreen
                />
              ) : (
                <>
                  <img
                    src={getCover(selected)}
                    alt={selected.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {canWatch(selected) ? (
                    <button
                      onClick={() => videoUrl && setPlaying(true)}
                      className="absolute inset-0 flex items-center justify-center group"
                    >
                      <span className="flex items-center justify-center w-20 h-20 rounded-full bg-white/15 backdrop-blur border border-white/40 group-hover:bg-white/25 group-hover:scale-110 transition-all">
                        <Play className="w-9 h-9 text-white fill-white ml-1" />
                      </span>
                    </button>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-5 py-2.5 rounded-full text-sm font-bold">
                        <Lock className="w-4 h-4" /> Acesso Restrito
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Informações básicas + ações */}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {selected.is_free && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-xs font-bold uppercase tracking-wider">
                      Acesso Liberado
                    </Badge>
                  )}
                  <span className="text-xs text-zinc-400 uppercase tracking-wider">
                    Documentário
                  </span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-white mb-2">{selected.title}</h2>
                {selected.description && (
                  <p className="text-sm text-zinc-300 line-clamp-3 max-w-3xl">
                    {selected.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {canWatch(selected) ? (
                  <Button
                    size="lg"
                    onClick={() =>
                      videoUrl
                        ? setPlaying(true)
                        : navigate(`/plataforma/documentarios/${selected.id}`)
                    }
                    className="bg-white text-black hover:bg-zinc-200 font-bold px-6 h-12 rounded-full"
                  >
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    {playing ? 'Reproduzindo...' : 'Assistir Agora'}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleLockedClick}
                    className="bg-amber-500 text-black hover:bg-amber-400 font-bold px-6 h-12 rounded-full"
                  >
                    <Lock className="w-5 h-5 mr-2" /> Faça Upgrade para Assistir
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="bg-zinc-800/60 border-zinc-500/50 text-white hover:bg-zinc-700/80 font-bold px-6 h-12 rounded-full"
                >
                  <Link to={`/plataforma/documentarios/${selected.id}`}>
                    <Info className="w-5 h-5 mr-2" /> Mais Detalhes
                  </Link>
                </Button>
              </div>

              {!videoUrl && canWatch(selected) && (
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" /> Vídeo não disponível no momento — veja a página
                  de detalhes.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
