import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { getDocProject } from '@/services/doc_projects'
import { DocProject } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, Film } from 'lucide-react'
import { BackToHub } from '@/components/student/BackToHub'
import pb from '@/lib/pocketbase/client'

const getPandaUrl = (val?: string) => {
  if (!val) return ''
  if (val.includes('<iframe') || val.includes('src="')) {
    const m = val.match(/src="([^"]+)"/)
    return m ? m[1] : ''
  }
  if (val.startsWith('http')) return val
  return `https://player-vz-c2b2b8c9-251.tv.pandavideo.com.br/embed/?v=${val}`
}

export default function DocumentaryViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [project, setProject] = useState<DocProject | null>(null)
  const [fetching, setFetching] = useState(true)

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

  const videoUrl = getPandaUrl(project.panda_video_id)
  const photos = project.presentation_photos || []

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

      <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-[1600px] mx-auto">
        <div className="lg:w-[56%] min-w-0">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            {videoUrl ? (
              <iframe
                src={videoUrl}
                className="w-full h-full border-none"
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Film className="w-16 h-16 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">Vídeo não disponível.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:w-[42%] shrink-0 space-y-5">
          <div>
            <h1 className="text-2xl font-serif font-bold text-white mb-3">{project.title}</h1>
            <p className="text-sm text-white/60 leading-relaxed">
              {project.description || 'Sem descrição disponível.'}
            </p>
          </div>

          {project.is_free && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Acesso Liberado
            </div>
          )}

          {photos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white/80 mb-3 uppercase tracking-wider">
                Galeria
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo, i) => (
                  <div key={i} className="aspect-video rounded-lg overflow-hidden bg-white/5">
                    <img
                      src={pb.files.getUrl(project, photo)}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
