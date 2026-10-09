import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Newspaper } from 'lucide-react'
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
      <div className="min-h-[calc(100vh-64px)] bg-background flex items-center justify-center text-muted-foreground font-medium text-sm">
        Carregando revista...
      </div>
    )

  if (!magazine)
    return (
      <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center text-muted-foreground gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Newspaper className="w-8 h-8 stroke-[1.75]" />
        </div>
        <p className="text-foreground font-serif font-bold text-lg">Revista não encontrada.</p>
        <Button
          variant="outline"
          onClick={() => navigate('/plataforma')}
          className="rounded-full border-[1.5px] border-foreground text-foreground hover:bg-muted min-h-[52px] px-6 font-semibold"
        >
          Voltar ao Hub
        </Button>
      </div>
    )

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col text-foreground">
      <div className="bg-card border-b border-border px-4 md:px-6 py-3.5 flex items-center justify-between gap-3 text-card-foreground">
        <div className="flex items-center gap-3 min-w-0">
          <BackToHub className="text-foreground hover:bg-muted" />
          <div className="min-w-0">
            <h1 className="text-foreground font-serif font-bold text-base md:text-lg truncate">
              {magazine.title}
            </h1>
            {magazine.summary && (
              <p className="text-muted-foreground text-xs line-clamp-1">{magazine.summary}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            disabled={!prevMag}
            onClick={() => prevMag && navigate(`/plataforma/revista/${prevMag.id}`)}
            className="rounded-full text-foreground hover:bg-muted disabled:opacity-30 h-9 px-3.5"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!nextMag}
            onClick={() => nextMag && navigate(`/plataforma/revista/${nextMag.id}`)}
            className="rounded-full text-foreground hover:bg-muted disabled:opacity-30 h-9 px-3.5"
          >
            Próxima <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-3 md:p-6 bg-muted/20">
        {magazine.embed_code ? (
          <div
            className="w-full h-full max-w-[1200px] bg-card rounded-[28px] overflow-hidden shadow-sm border border-border [&>iframe]:w-full [&>iframe]:h-[80vh]"
            dangerouslySetInnerHTML={{ __html: magazine.embed_code }}
          />
        ) : magazine.fliphtml5_link ? (
          <iframe
            src={magazine.fliphtml5_link}
            className="w-full max-w-[1200px] h-[80vh] bg-card rounded-[28px] shadow-sm border border-border"
            title={magazine.title}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground gap-4 py-20 bg-card rounded-[28px] border border-border p-8 max-w-lg mx-auto w-full text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Newspaper className="w-8 h-8 stroke-[1.75]" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Esta edição ainda não possui conteúdo publicado para leitura.
            </p>
            {magazine.thumbnail && (
              <img
                src={pb.files.getUrl(magazine, magazine.thumbnail)}
                alt={magazine.title}
                className="max-h-72 rounded-2xl shadow-sm border border-border object-contain"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
