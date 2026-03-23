import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, BookX, Loader2, ImageOff } from 'lucide-react'
import { getMagazines } from '@/services/magazines'
import { Magazine } from '@/types'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

function MagazineCard({ mag }: { mag: Magazine }) {
  const [isProcessing, setIsProcessing] = useState(false)

  // Manage visual state to prevent eternal "Processing"
  useEffect(() => {
    const checkProcessing = () => {
      const hasLink = !!mag.fliphtml5_link
      const hasNoThumb = !mag.thumbnail

      if (!hasLink || !hasNoThumb) {
        setIsProcessing(false)
        return
      }

      const updatedTime = new Date(mag.updated).getTime()
      const now = Date.now()
      // If the record was updated less than 30 seconds ago, assume processing
      if (now - updatedTime < 30000) {
        setIsProcessing(true)
      } else {
        setIsProcessing(false)
      }
    }

    checkProcessing()
    const interval = setInterval(checkProcessing, 2000)
    return () => clearInterval(interval)
  }, [mag.thumbnail, mag.fliphtml5_link, mag.updated])

  const imgUrl = mag.thumbnail ? pb.files.getUrl(mag, mag.thumbnail) : null

  return (
    <Card
      className="group overflow-hidden border border-slate-200/60 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white cursor-pointer flex flex-col h-full animate-fade-in-up"
      onClick={() => window.open(mag.fliphtml5_link || '#', '_blank')}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={mag.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200/50 text-slate-400 gap-3">
            <ImageOff className="w-12 h-12 opacity-40" />
            <span className="text-sm font-medium">Capa indisponível</span>
          </div>
        )}

        {isProcessing && !imgUrl && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando capa
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
          <Button
            className="w-full bg-yellow-400 text-emerald-950 hover:bg-yellow-500 translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-bold"
            onClick={(e) => {
              e.stopPropagation()
              window.open(mag.fliphtml5_link || '#', '_blank')
            }}
          >
            <BookOpen className="w-4 h-4 mr-2" /> Ler Edição
          </Button>
        </div>
      </div>
      <CardContent className="p-6 flex-grow flex flex-col bg-white">
        <h3 className="font-serif font-bold text-xl text-emerald-950 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors mb-3">
          {mag.title}
        </h3>
        <p className="text-slate-600 line-clamp-3 flex-grow leading-relaxed text-sm">
          {mag.summary || 'Resumo não disponível para esta edição.'}
        </p>
      </CardContent>
    </Card>
  )
}

export default function Revistas() {
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const data = await getMagazines()
      setMagazines(data)
    } catch (err) {
      console.error('Error fetching magazines:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('magazines', () => {
    loadData()
  })

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <section className="bg-emerald-950 text-white py-20 border-b-4 border-yellow-400">
        <div className="container px-4 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-yellow-400 drop-shadow-sm">
            Acervo Científico
          </h1>
          <p className="text-lg text-emerald-100/90 leading-relaxed font-light">
            Acesso público e gratuito às nossas publicações periódicas com artigos focados no avanço
            da Segurança e Saúde no Trabalho.
          </p>
        </div>
      </section>

      <section className="container px-4 pt-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full aspect-[3/4] rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        ) : magazines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in-up bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <BookX className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-emerald-950 mb-3">
              Nenhuma revista publicada
            </h2>
            <p className="text-slate-500 max-w-md text-lg">
              Nosso acervo está sendo preparado. Em breve, teremos novas edições repletas de
              conhecimento em SST para você.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {magazines.map((mag) => (
              <MagazineCard key={mag.id} mag={mag} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
