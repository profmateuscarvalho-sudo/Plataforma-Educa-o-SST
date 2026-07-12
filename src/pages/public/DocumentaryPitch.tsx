import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { DocProject } from '@/types'
import { getDocProject } from '@/services/doc_projects'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Film } from 'lucide-react'
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500 animate-pulse">
        Carregando...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white flex-col gap-6">
        <h1 className="text-3xl font-light">Documentário não encontrado</h1>
        <Button variant="outline" className="border-amber-500 text-amber-500" asChild>
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    )
  }

  const videoUrl = getPandaUrl(project.panda_video_id)
  const coverImage = project.presentation_photos?.[0]
    ? pb.files.getUrl(project, project.presentation_photos[0])
    : null

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-20">
      <div className="absolute top-6 left-6 z-50">
        <Logo className="text-white drop-shadow-md" />
      </div>

      <div className="container max-w-5xl mx-auto px-6 pt-32">
        <Button
          variant="ghost"
          className="mb-8 text-zinc-400 hover:text-white"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <div className="space-y-8">
          {coverImage && (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800">
              <img
                src={coverImage}
                alt={project.title}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            </div>
          )}

          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-500 text-sm font-medium uppercase tracking-widest">
              <Film className="w-4 h-4" /> Documentário
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">
              {project.title}
            </h1>
            {project.description && (
              <p className="text-lg text-zinc-300 max-w-3xl mx-auto leading-relaxed font-light">
                {project.description}
              </p>
            )}
          </div>

          {videoUrl && (
            <div className="bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
              <div className="aspect-video w-full">
                <iframe
                  src={videoUrl}
                  className="w-full h-full border-none"
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
