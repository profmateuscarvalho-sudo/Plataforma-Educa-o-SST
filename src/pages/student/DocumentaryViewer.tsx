import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { getDocProject } from '@/services/doc_projects'
import { DocProject } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, Play, Film, Lock } from 'lucide-react'
import { BackToHub } from '@/components/student/BackToHub'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { Link } from 'react-router-dom'

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

export default function DocumentaryViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [project, setProject] = useState<DocProject | null>(null)
  const [fetching, setFetching] = useState(true)
  const [mode, setMode] = useState<'details' | 'player'>('details')

  useEffect(() => {
    if (!id) return
    getDocProject(id)
      .then(setProject)
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [id])

  if (loading || fetching)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        Carregando...
      </div>
    )

  if (!user) return <Navigate to="/login" replace />
  if (!project)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        Documentário não encontrado.
      </div>
    )

  const hasAccess =
    project.is_free ||
    user.role === 'admin' ||
    (user.plan_tier && user.plan_tier !== 'free') ||
    (!!user.contract_end_date && new Date(user.contract_end_date) >= new Date())

  if (!hasAccess) {
    return <Navigate to="/planos" replace />
  }

  const youtubeEmbedUrl = getYoutubeEmbedUrl(project.youtube_url)
  const videoUrl = youtubeEmbedUrl || getPandaUrl(project.panda_video_id)
  const photos = project.presentation_photos || []

  if (mode === 'player') {
    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
          <div className="text-center">
            <Lock className="w-16 h-16 mx-auto mb-4 text-amber-400" />
            <p className="text-xl font-bold mb-2">Acesso não liberado</p>
            <Button
              onClick={() => setMode('details')}
              className="mt-4 bg-white text-black hover:bg-zinc-200"
            >
              Voltar aos detalhes
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <button
          onClick={() => setMode('details')}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 text-white/80 hover:text-white bg-black/50 px-4 h-10 rounded-full backdrop-blur transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar aos detalhes
        </button>
        {videoUrl ? (
          <iframe
            src={videoUrl}
            className="w-full h-full border-none"
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="text-center text-white/50">
            <Film className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p>Vídeo não disponível.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-white/10 px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/plataforma/documentarios')}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <BackToHub />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            {project.title}
          </h1>
          <p className="text-base text-white/60 leading-relaxed max-w-3xl">
            {project.description || 'Sem descrição disponível.'}
          </p>
        </div>

        {project.is_free && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
            Acesso Liberado
          </div>
        )}

        {photos.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-white/80 mb-3 uppercase tracking-wider">
              Galeria de Imagens
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/5"
                >
                  <img
                    src={pb.files.getUrl(project, photo)}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-center pt-4 border-t border-white/10">
          {hasAccess ? (
            <Button
              size="lg"
              onClick={() => setMode('player')}
              className="bg-white text-black hover:bg-zinc-200 text-lg font-bold px-8 h-14 rounded-full w-full sm:w-auto"
            >
              <Play className="w-5 h-5 mr-2 fill-current" /> Assistir Agora
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-6 py-3 rounded-full text-lg font-bold">
                <Lock className="w-5 h-5" />
                Acesso não liberado
              </div>
              <Button
                size="lg"
                className="bg-amber-500 text-black hover:bg-amber-400 text-lg font-bold px-8 h-14 rounded-full"
                asChild
              >
                <Link to="/planos">Fazer Upgrade para Assistir</Link>
              </Button>
            </div>
          )}
          {!videoUrl && hasAccess && (
            <p className="text-sm text-white/40">Vídeo não disponível no momento.</p>
          )}
        </div>
      </div>
    </div>
  )
}
