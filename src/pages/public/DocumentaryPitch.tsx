import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getDocProject } from '@/services/doc_projects'
import { DocProject } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Calendar, Clock } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DocumentaryPitch() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<DocProject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getDocProject(id)
      .then((p) => setProject(p))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse">Carregando documentário...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Documentário não encontrado.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const coverUrl = project.presentation_photos?.length
    ? pb.files.getUrl(project, project.presentation_photos[0])
    : `https://img.usecurling.com/p/1280/720?q=documentary%20film`

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          {project.is_free && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
              Acesso Liberado
            </Badge>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
          {project.panda_video_id ? (
            <iframe
              src={`https://player-vz-${project.panda_video_id}.tv.pandavideo.com.br/embed/?v=${project.panda_video_id}`}
              className="w-full h-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              title={project.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative">
              <img
                src={coverUrl}
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
                <p className="text-zinc-400">Vídeo em breve</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
              {project.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(project.created), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              {project.is_free && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Play className="w-4 h-4" /> Acesso Liberado
                </span>
              )}
            </div>
          </div>

          {project.description && (
            <div className="prose prose-invert max-w-none">
              <p className="text-zinc-300 text-lg leading-relaxed">{project.description}</p>
            </div>
          )}

          {project.presentation_photos && project.presentation_photos.length > 1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Galeria</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.presentation_photos.slice(1).map((photo, idx) => (
                  <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-zinc-800">
                    <img
                      src={pb.files.getUrl(project, photo)}
                      alt={`Foto ${idx + 2}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-white/10">
            <Button
              variant="outline"
              className="text-white border-white/20 hover:bg-white/10"
              asChild
            >
              <Link to="/plataforma/documentarios">
                <ArrowLeft className="w-4 h-4 mr-2" /> Ver todos os documentários
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
