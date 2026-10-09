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
        <div className="min-h-screen bg-background flex items-center justify-center text-foreground p-4">
          <div className="text-center bg-card p-8 rounded-[28px] border border-border max-w-md">
            <Lock className="w-14 h-14 mx-auto mb-4 text-primary" />
            <p className="text-xl font-serif font-semibold mb-2">Acesso não liberado</p>
            <Button
              onClick={() => setMode('details')}
              className="mt-4 min-h-[52px] px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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
          className="absolute top-4 left-4 z-10 flex items-center gap-2 text-foreground hover:bg-muted bg-card/80 px-4 min-h-[44px] rounded-full backdrop-blur border border-border transition-colors text-xs font-semibold"
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
          <div className="text-center text-muted-foreground">
            <Film className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Vídeo não disponível.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur border-b border-border px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate('/plataforma/documentarios')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm rounded-full min-h-[40px] px-3"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <BackToHub className="border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-muted rounded-full min-h-[40px] px-4" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
            {project.title}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
            {project.description || 'Sem descrição disponível.'}
          </p>
        </div>

        {project.is_free && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E3F1E9] text-[#1F6B4A] dark:bg-[#1F6B4A]/30 dark:text-[#E3F1E9] border border-[#1F6B4A]/30 text-xs font-semibold uppercase tracking-wider mb-6">
            Acesso Liberado
          </div>
        )}

        {photos.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Galeria de Imagens
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-[20px] overflow-hidden bg-muted border border-border"
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

        <div className="flex flex-col sm:flex-row gap-4 items-center pt-6 border-t border-border">
          {hasAccess ? (
            <Button
              onClick={() => setMode('player')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 min-h-[52px] rounded-full w-full sm:w-auto"
            >
              <Play className="w-5 h-5 mr-2 fill-current" /> Assistir Agora
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-[#FAE7E1] dark:bg-[#B4472E]/30 text-[#B4472E] dark:text-[#FAE7E1] border border-[#B4472E]/30 px-6 py-3 rounded-full text-sm font-semibold">
                <Lock className="w-4 h-4" />
                Acesso não liberado
              </div>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 min-h-[52px] rounded-full"
                asChild
              >
                <Link to="/planos">Fazer Upgrade para Assistir</Link>
              </Button>
            </div>
          )}
          {!videoUrl && hasAccess && (
            <p className="text-xs text-muted-foreground">Vídeo não disponível no momento.</p>
          )}
        </div>
      </div>
    </div>
  )
}
