import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDocProject } from '@/services/doc_projects'
import { DocProject } from '@/types'
import { useProtectedVideo } from '@/hooks/use-protected-video'
import { LockedVideo } from '@/components/student/LockedVideo'
import { useTrackAccess } from '@/hooks/use-track-access'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function DocumentaryViewer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<DocProject | null>(null)
  const [loading, setLoading] = useState(true)

  useTrackAccess('Documentários')

  // Link do vídeo NUNCA vem do registro (a guarda do servidor esconde o campo
  // de quem não tem direito): busca pela rota protegida ao abrir o player.
  const protectedVideo = useProtectedVideo(project?.id || null, 'documentary')

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const p = await getDocProject(id)
        setProject(p)
      } catch {
        setProject(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando documentário...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Documentário não encontrado.</p>
          <Button variant="outline" onClick={() => navigate('/plataforma/documentarios')}>
            Voltar ao catálogo
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
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate('/plataforma/documentarios')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao catálogo
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
          {protectedVideo.unlocked && protectedVideo.video?.url ? (
            <iframe
              src={protectedVideo.video.url}
              className="w-full h-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              title={project.title}
            />
          ) : protectedVideo.loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <LockedVideo
              className="bg-zinc-900 border-white/10"
              message="Este documentário está disponível para assinantes dos planos Prata e Ouro."
            />
          )}
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
              {project.title}
            </h1>
            {project.description && (
              <div className="prose prose-invert max-w-none">
                <p className="text-zinc-300 text-lg leading-relaxed">{project.description}</p>
              </div>
            )}
          </div>

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
        </div>
      </div>
    </div>
  )
}
