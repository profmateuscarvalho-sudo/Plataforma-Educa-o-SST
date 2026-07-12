import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { getDocProject } from '@/services/doc_projects'
import { DocProject } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft } from 'lucide-react'

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
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Carregando...
      </div>
    )

  if (!user) return <Navigate to="/login" replace />
  if (!project)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Documentário não encontrado.
      </div>
    )

  const videoUrl = getPandaUrl(project.panda_video_id)

  return (
    <div className="min-h-screen bg-black relative">
      <button
        onClick={() => navigate('/plataforma/documentarios')}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur text-white/80 hover:text-white hover:bg-black/60 transition-all text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="w-full h-screen flex items-center justify-center">
        {videoUrl ? (
          <iframe
            src={videoUrl}
            className="w-full h-full border-none"
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="text-center px-8">
            <h1 className="text-2xl font-serif font-bold text-white mb-2">{project.title}</h1>
            <p className="text-white/50">Vídeo não disponível.</p>
          </div>
        )}
      </div>
    </div>
  )
}
