import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getNewsById } from '@/services/news'
import { News } from '@/types'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Share2, Instagram, Linkedin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { setMetaTags, stripHtml } from '@/lib/utils'

export default function NewsDetails() {
  const { id } = useParams()
  const [news, setNews] = useState<News | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (id) getNewsById(id).then(setNews).catch(console.error)
  }, [id])

  const galleryImages = news && Array.isArray(news.images) ? news.images : []
  const coverUrl = news
    ? news.image
      ? pb.files.getUrl(news, news.image as string)
      : galleryImages.length > 0
        ? pb.files.getUrl(news, galleryImages[0])
        : 'https://img.usecurling.com/p/1200/600?q=industry&color=gray'
    : ''

  const shareUrl = window.location.href

  useEffect(() => {
    if (news) {
      let plainText = stripHtml(news.content)
      if (plainText.length > 180) {
        plainText = plainText.substring(0, 180) + '...'
      }
      setMetaTags({
        title: news.title,
        description: plainText,
        image: coverUrl,
        url: shareUrl,
      })
    }
  }, [news, coverUrl, shareUrl])

  if (!news)
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="h-96 w-full relative">
        <img src={coverUrl} alt={news.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-end">
          <div className="container px-4 max-w-4xl mx-auto pb-12">
            <Button
              variant="ghost"
              className="text-white hover:text-white/80 hover:bg-white/10 mb-6 pl-0"
              asChild
            >
              <Link to="/noticias">
                <ChevronLeft className="w-4 h-4 mr-2" /> Voltar para Notícias
              </Link>
            </Button>
            <p className="text-accent font-bold mb-4">
              {new Date(news.created).toLocaleDateString('pt-BR')}
            </p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
              {news.title}
            </h1>
          </div>
        </div>
      </div>

      <main className="container px-4 py-12 max-w-4xl mx-auto">
        <div
          className="prose max-w-none text-slate-700 leading-relaxed lg:prose-lg mb-16"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />

        {galleryImages.length > 0 && (
          <div className="space-y-6 mt-12">
            <h3 className="text-2xl font-serif font-bold text-secondary border-b pb-4">
              Galeria de Fotos
            </h3>
            <Carousel className="w-full max-w-3xl mx-auto">
              <CarouselContent>
                {galleryImages.map((img, i) => (
                  <CarouselItem key={i}>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-200">
                      <img
                        src={pb.files.getUrl(news, img)}
                        alt={`Galeria ${i + 1}`}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-black/40 border-0 text-white hover:bg-black/60 hover:text-white" />
              <CarouselNext className="right-4 bg-black/40 border-0 text-white hover:bg-black/60 hover:text-white" />
            </Carousel>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-16 pt-8 border-t">
          <div className="w-full md:w-auto text-lg font-bold font-serif md:mr-4">Compartilhe:</div>
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent(news.title + ' ' + shareUrl)}`,
                '_blank',
              )
            }
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 w-4 h-4"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                '_blank',
              )
            }
          >
            <Linkedin className="mr-2 w-4 h-4" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl)
              toast({ title: 'Link copiado!', description: 'Cole no Instagram para compartilhar.' })
            }}
          >
            <Instagram className="mr-2 w-4 h-4" />
            Instagram
          </Button>
        </div>
      </main>
    </div>
  )
}
