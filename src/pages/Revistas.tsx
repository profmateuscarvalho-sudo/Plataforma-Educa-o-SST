import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, BookX, Loader2, ImageOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getMagazines } from '@/services/magazines'
import { Magazine } from '@/types'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { setMetaTags } from '@/lib/utils'
import { PUBLIC_URL, getSharePreviewUrl } from '@/lib/constants'
import { AppLanguage } from '@/i18n'
import { PageHeader } from '@/components/PageHeader'

function MagazineCard({ mag }: { mag: Magazine }) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(false)
  const [open, setOpen] = useState(searchParams.get('revista') === mag.id)

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

  const imgUrl = mag.thumbnail ? pb.files.getURL(mag, mag.thumbnail) : null

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setSearchParams({ revista: mag.id }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Card
        className="group overflow-hidden border border-slate-200/60 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white cursor-pointer flex flex-col h-full animate-fade-in-up"
        onClick={() => handleOpenChange(true)}
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
              <span className="text-sm font-medium">{t('revistas.coverUnavailable')}</span>
            </div>
          )}

          {isProcessing && !imgUrl && (
            <div className="absolute top-3 right-3 bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('revistas.processing')}
            </div>
          )}
          {!mag.is_free && (
            <div className="absolute top-3 left-3 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              {t('revistas.subscribersAccess')}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
            <DialogTrigger asChild>
              <Button
                className="w-full bg-yellow-400 text-emerald-950 hover:bg-yellow-500 translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-bold"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenChange(true)
                }}
              >
                <BookOpen className="w-4 h-4 mr-2" /> {t('revistas.readEdition')}
              </Button>
            </DialogTrigger>
          </div>
        </div>
        <CardContent className="p-6 flex-grow flex flex-col bg-white">
          {mag.is_featured && (
            <span className="text-xs font-bold text-accent mb-2 uppercase tracking-wider">
              {t('revistas.featuredEdition')}
            </span>
          )}
          <h3 className="font-serif font-bold text-xl text-emerald-950 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors mb-3">
            {mag.title}
          </h3>
          <p className="text-slate-600 line-clamp-3 flex-grow leading-relaxed text-sm">
            {mag.summary || t('revistas.summaryUnavailable')}
          </p>
        </CardContent>
      </Card>

      <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 overflow-hidden bg-black/5 border-none">
        <DialogTitle className="sr-only">{mag.title}</DialogTitle>
        {mag.embed_code ? (
          <div
            className="w-full h-full bg-white [&>iframe]:w-full [&>iframe]:h-full"
            dangerouslySetInnerHTML={{ __html: mag.embed_code }}
          />
        ) : (
          <iframe
            src={mag.fliphtml5_link}
            className="w-full h-full border-none rounded-lg bg-white"
            allowFullScreen
            scrolling="no"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function Revistas() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [loading, setLoading] = useState(true)

  // Normaliza o idioma ativo (ex: "es" ou "pt-BR")
  const currentLang: AppLanguage = i18n.language?.startsWith('es') ? 'es' : 'pt-BR'

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      // Carrega revistas no idioma atual selecionado pelo aluno
      const data = await getMagazines({ language: currentLang })
      setMagazines(data)
    } catch (err) {
      console.error('Error fetching magazines:', err)
    } finally {
      setLoading(false)
    }
  }, [currentLang])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('magazines', () => {
    loadData()
  })

  useEffect(() => {
    const revistaId = searchParams.get('revista')
    if (revistaId && magazines.length > 0) {
      const mag = magazines.find((m) => m.id === revistaId)
      if (mag) {
        const imgUrl = mag.thumbnail
          ? `${PUBLIC_URL}/api/files/${mag.collectionId}/${mag.id}/${mag.thumbnail}`
          : 'https://img.usecurling.com/p/1200/630?q=magazine%20cover&color=blue'
        const shareUrl = getSharePreviewUrl('revistas', mag.id)
        setMetaTags({
          title: `${mag.title} | Educação SST`,
          description: mag.summary || 'Confira esta edição da Revista SST.',
          image: imgUrl,
          url: shareUrl,
        })
      }
    } else {
      setMetaTags({
        title: t('revistas.pageTitle'),
        description: t('revistas.metaDescription'),
        url: window.location.href,
      })
    }
  }, [searchParams, magazines, t])

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-2">
            <span className="label-overline">{t('nav.magazines', 'Revistas Digitais')}</span>
            <span className="text-xs text-muted-foreground/80">
              · {currentLang === 'es' ? '🇪🇸 Edición en Español' : '🇧🇷 Edição em Português'}
            </span>
          </span>
        }
        title={t('revistas.title')}
        description={t('revistas.subtitle')}
      />

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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mb-3">
              <span>{currentLang === 'es' ? '🇪🇸 Español' : '🇧🇷 Português'}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-emerald-950 mb-3">
              {t('revistas.noneTitle')}
            </h2>
            <p className="text-slate-500 max-w-md text-lg">{t('revistas.noneBody')}</p>
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
