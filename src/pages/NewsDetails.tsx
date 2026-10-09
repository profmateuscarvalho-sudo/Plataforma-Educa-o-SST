import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getNewsById } from '@/services/news'
import { News } from '@/types'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Instagram, Linkedin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { setMetaTags, stripHtml } from '@/lib/utils'
import { PUBLIC_URL, getSharePreviewUrl, getOgPreviewUrl } from '@/lib/constants'
import { BannerDisplay } from '@/components/BannerDisplay'

// NÃO alterar a lógica de injeção das tags Open Graph
const injectOGTags = (title: string, desc: string, image: string, url: string) => {
  document.title = title
  const updateMeta = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('property', property)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }
  updateMeta('og:title', title)
  updateMeta('og:description', desc)
  updateMeta('og:image', image)
  updateMeta('og:url', url)
  updateMeta('og:type', 'article')
}

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
  const ogImageUrl = news
    ? news.image
      ? `${PUBLIC_URL}/api/files/${news.collectionId}/${news.id}/${news.image as string}`
      : galleryImages.length > 0
        ? `${PUBLIC_URL}/api/files/${news.collectionId}/${news.id}/${galleryImages[0]}`
        : 'https://img.usecurling.com/p/1200/600?q=industry&color=gray'
    : ''

  const shareUrl = getSharePreviewUrl('news', id || '')
  const actualUrl = `${PUBLIC_URL}/noticias/${id}`
  const _ogPreviewUrl = getOgPreviewUrl(`/noticias/${id}`)

  useEffect(() => {
    if (news) {
      let plainText = stripHtml(news.content)
      if (plainText.length > 180) {
        plainText = plainText.substring(0, 180) + '...'
      }
      setMetaTags({
        title: news.title,
        description: plainText,
        image: ogImageUrl,
        url: actualUrl,
      })
      injectOGTags(news.title, plainText, ogImageUrl, actualUrl)
    }
  }, [news, ogImageUrl, actualUrl])

  if (!news)
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1C1B18]/20 border-t-[#FDBE2D] rounded-full animate-spin" />
      </div>
    )

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C1B18] pb-24">
      {/* Botão de retorno e cabeçalho editorial com largura max 720px */}
      <div className="border-b border-[#E4DED1] bg-white">
        <div className="max-w-[720px] mx-auto px-6 pt-10 pb-12">
          <Button
            variant="ghost"
            className="text-[#7F7869] hover:text-[#1C1B18] hover:bg-[#FAF8F3] -ml-3 mb-6 font-medium rounded-full"
            asChild
          >
            <Link to="/noticias">
              <ChevronLeft className="w-4 h-4 mr-1.5" /> Voltar para Notícias
            </Link>
          </Button>

          <div className="flex flex-wrap gap-3 items-center mb-5">
            {news.category && (
              <span className="bg-[#173F33] text-[#F4F1E8] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {news.category}
              </span>
            )}
            <span className="text-xs sm:text-sm font-mono text-[#7F7869]">
              {new Date(news.created).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-[44px] font-serif font-semibold text-[#1C1B18] leading-[1.15] tracking-tight">
            {news.title}
          </h1>
        </div>
      </div>

      {/* Imagem de Capa */}
      {coverUrl && (
        <div className="max-w-[1000px] mx-auto px-6 pt-8 pb-4">
          <div className="aspect-[16/9] md:aspect-[21/10] rounded-[28px] overflow-hidden border border-[#E4DED1] bg-white shadow-[0_8px_24px_rgba(28,27,24,0.04)]">
            <img src={coverUrl} alt={news.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Conteúdo com largura de leitura de no máximo 720px, corpo em 18px com entrelinha 1.7 */}
      <main className="max-w-[720px] mx-auto px-6 py-10">
        <div
          className="text-[#1C1B18] text-[18px] leading-[1.7] space-y-6 [&>p]:leading-[1.7] [&>p]:mb-6 [&>h2]:font-serif [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:font-serif [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>blockquote]:border-l-4 [&>blockquote]:border-[#FDBE2D] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-[#5F5A4F]"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />

        <BannerDisplay location="Lateral dos Artigos" className="my-10 max-w-sm mx-auto" />

        {galleryImages.length > 0 && (
          <div className="space-y-6 my-12 border-t border-[#E4DED1] pt-8">
            <span className="label-overline">REGISTROS VISUAIS</span>
            <h3 className="text-2xl font-serif font-semibold text-[#1C1B18]">Galeria de Fotos</h3>
            <Carousel className="w-full">
              <CarouselContent>
                {galleryImages.map((img, i) => (
                  <CarouselItem key={i}>
                    <div className="rounded-[28px] overflow-hidden bg-white border border-[#E4DED1] flex items-center justify-center p-3 max-h-[500px]">
                      <img
                        src={pb.files.getUrl(news, img)}
                        alt={`Galeria ${i + 1}`}
                        className="w-auto h-auto max-w-full max-h-[460px] object-contain rounded-2xl"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-white/90 border-[#E4DED1] text-[#1C1B18] hover:bg-white" />
              <CarouselNext className="right-4 bg-white/90 border-[#E4DED1] text-[#1C1B18] hover:bg-white" />
            </Carousel>
          </div>
        )}

        {/* Compartilhamento */}
        <div className="flex flex-wrap items-center gap-3 pt-8 mt-12 border-t border-[#E4DED1]">
          <span className="text-sm font-bold uppercase tracking-wider text-[#1C1B18] mr-2">
            Compartilhar:
          </span>
          <Button
            variant="outline"
            className="rounded-full border-[#E4DED1] text-[#1C1B18] hover:bg-white hover:text-[#25D366] transition-colors"
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent(news.title + ' ' + shareUrl)}`,
                '_blank',
              )
            }
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 w-4 h-4"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            WhatsApp
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-[#E4DED1] text-[#1C1B18] hover:bg-white transition-colors"
            onClick={() =>
              window.open(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                '_blank',
              )
            }
          >
            <Linkedin className="mr-2 w-4 h-4 text-[#0A66C2]" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-[#E4DED1] text-[#1C1B18] hover:bg-white transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl)
              toast({
                title: 'Link copiado!',
                description: 'Cole no Instagram ou redes para compartilhar.',
              })
            }}
          >
            <Instagram className="mr-2 w-4 h-4 text-[#E4405F]" />
            Copiar Link
          </Button>
        </div>

        <BannerDisplay location="Rodapé" className="mt-12" />
      </main>
    </div>
  )
}
