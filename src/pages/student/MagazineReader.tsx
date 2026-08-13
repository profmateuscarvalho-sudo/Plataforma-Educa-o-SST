import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Newspaper, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BackToHub } from '@/components/student/BackToHub'
import pb from '@/lib/pocketbase/client'
import { getMagazines } from '@/services/magazines'
import type { Magazine } from '@/types'

export default function MagazineReader() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMagazines()
      .then(setMagazines)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const currentIndex = magazines.findIndex((m) => m.id === id)
  const magazine = currentIndex >= 0 ? magazines[currentIndex] : null
  const prevMag = currentIndex > 0 ? magazines[currentIndex - 1] : null
  const nextMag =
    currentIndex >= 0 && currentIndex < magazines.length - 1 ? magazines[currentIndex + 1] : null

  if (loading)
    return (
      <div className="min-h-[calc(100vh-56px)] bg-slate-50 flex items-center justify-center text-slate-500">
        Carregando revista...
      </div>
    )

  if (!magazine)
    return (
      <div className="min-h-[calc(100vh-56px)] bg-slate-50 flex flex-col items-center justify-center text-slate-500 gap-4">
        <Newspaper className="w-12 h-12 text-slate-300" />
        <p>Revista não encontrada.</p>
        <Button variant="outline" onClick={() => navigate('/plataforma')}>
          Voltar ao Hub
        </Button>
      </div>
    )

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-900 flex flex-col">
      <div className="bg-slate-800/80 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <BackToHub className="text-white/80 hover:text-white hover:bg-white/10" />
          <div className="min-w-0">
            <h1 className="text-white font-serif font-bold text-lg truncate">{magazine.title}</h1>
            {magazine.summary && (
              <p className="text-slate-400 text-xs line-clamp-1">{magazine.summary}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            disabled={!prevMag}
            onClick={() => prevMag && navigate(`/plataforma/revista/${prevMag.id}`)}
            className="text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!nextMag}
            onClick={() => nextMag && navigate(`/plataforma/revista/${nextMag.id}`)}
            className="text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            Próxima <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-2 md:p-4">
        {magazine.embed_code ? (
          <div
            className="w-full h-full max-w-[1200px] bg-white rounded-lg overflow-hidden shadow-2xl [&>iframe]:w-full [&>iframe]:h-[80vh]"
            dangerouslySetInnerHTML={{ __html: magazine.embed_code }}
          />
        ) : magazine.fliphtml5_link ? (
          <iframe
            src={magazine.fliphtml5_link}
            className="w-full max-w-[1200px] h-[80vh] bg-white rounded-lg shadow-2xl border-none"
            allowFullScreen
            scrolling="no"
            title={magazine.title}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-4 py-24">
            <Newspaper className="w-16 h-16 text-slate-600" />
            <p className="text-center max-w-sm">
              Esta edição ainda não possui conteúdo publicado para leitura.
            </p>
            {magazine.thumbnail && (
              <img
                src={pb.files.getUrl(magazine, magazine.thumbnail)}
                alt={magazine.title}
                className="max-h-72 rounded-lg shadow-lg object-contain"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
