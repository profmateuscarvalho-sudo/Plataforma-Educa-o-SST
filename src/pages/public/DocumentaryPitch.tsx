import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { DocProject } from '@/types'
import { getDocProject } from '@/services/doc_projects'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Film, Home, Sparkles } from 'lucide-react'
import { Logo } from '@/components/ui/Logos'

const getPandaUrl = (val?: string) => {
  if (!val) return ''
  if (val.includes('<iframe') || val.includes('src="')) {
    const match = val.match(/src="([^"]+)"/)
    return match ? match[1] : ''
  }
  if (val.startsWith('http')) return val
  return `https://player-vz-c2b2b8c9-251.tv.pandavideo.com.br/embed/?v=${val}`
}

export default function DocumentaryPitch() {
  const { id } = useParams()
  const [project, setProject] = useState<DocProject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getDocProject(id)
      .then(setProject)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 animate-pulse">
        Carregando...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white flex-col gap-6">
        <h1 className="text-3xl font-light">Documentário não encontrado</h1>
        <Button variant="outline" className="border-amber-500 text-amber-500" asChild>
          <Link to="/aluno/documentarios">Voltar</Link>
        </Button>
      </div>
    )
  }

  const videoUrl = getPandaUrl(project.panda_video_id)

  return (
    <div className="min-h-screen bg-black text-zinc-50 flex flex-col">
      <header className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-5 bg-gradient-to-b from-black/80 to-transparent">
        <Logo className="text-white drop-shadow-md" />
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-zinc-300 hover:text-white hover:bg-white/10 rounded-full"
            asChild
          >
            <Link to="/aluno/documentarios">
              <ArrowLeft className="w-4 h-4 mr-2" /> Documentários
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="text-zinc-300 hover:text-white hover:bg-white/10 rounded-full"
            asChild
          >
            <Link to="/aluno">
              <Home className="w-4 h-4 mr-2" /> Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col w-full pt-28 pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {videoUrl ? (
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10">
              <iframe
                src={videoUrl}
                className="w-full h-full border-none"
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center ring-1 ring-white/10">
              <div className="text-center space-y-3">
                <Film className="w-16 h-16 text-zinc-700 mx-auto" />
                <p className="text-zinc-500 text-lg font-light">Vídeo não disponível</p>
              </div>
            </div>
          )}

          <div className="mt-8 w-full space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 text-amber-500 text-sm font-medium uppercase tracking-widest">
                <Film className="w-4 h-4" /> Documentário
              </div>
              {project.is_free && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-widest px-3 py-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Acesso Liberado
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight leading-tight">
              {project.title}
            </h1>

            {project.description && (
              <p className="text-base md:text-lg text-zinc-400 leading-relaxed font-light">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
