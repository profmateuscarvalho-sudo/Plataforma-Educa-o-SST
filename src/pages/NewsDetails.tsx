import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getNewsById } from '@/services/news'
import { News } from '@/types'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default function NewsDetails() {
  const { id } = useParams()
  const [news, setNews] = useState<News | null>(null)

  useEffect(() => {
    if (id) getNewsById(id).then(setNews).catch(console.error)
  }, [id])

  if (!news)
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>

  const images = Array.isArray(news.images) ? news.images : news.images ? [news.images] : []
  const coverUrl = images[0]
    ? pb.files.getUrl(news, images[0])
    : news.image
      ? pb.files.getUrl(news, news.image as string)
      : 'https://img.usecurling.com/p/1200/600?q=industry&color=gray'

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

        {images.length > 1 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold text-secondary border-b pb-4">
              Galeria de Fotos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.slice(1).map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-200">
                  <img
                    src={pb.files.getUrl(news, img)}
                    alt="Galeria"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
