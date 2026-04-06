import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { getNews } from '@/services/news'
import { News } from '@/types'
import pb from '@/lib/pocketbase/client'

export default function Noticias() {
  const [news, setNews] = useState<News[]>([])

  useEffect(() => {
    getNews().then(setNews).catch(console.error)
  }, [])

  const extractSummary = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return (tmp.textContent || tmp.innerText || '').slice(0, 120) + '...'
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <section className="bg-secondary text-white py-20">
        <div className="container px-4 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-accent">
            Notícias em SST
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed font-light">
            Fique por dentro das últimas atualizações do mercado de Segurança e Saúde no Trabalho.
          </p>
        </div>
      </section>

      <section className="container px-4 pt-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((n) => {
            const images = Array.isArray(n.images) ? n.images : n.images ? [n.images] : []
            const imgUrl = images[0]
              ? pb.files.getUrl(n, images[0])
              : n.image
                ? pb.files.getUrl(n, n.image as string)
                : 'https://img.usecurling.com/p/800/400?q=industry&color=gray'
            return (
              <Card
                key={n.id}
                className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col h-full"
              >
                <img src={imgUrl} alt={n.title} className="w-full h-48 object-cover shrink-0" />
                <CardHeader className="pb-3 shrink-0">
                  <p className="text-xs text-primary font-bold mb-2">
                    {new Date(n.created).toLocaleDateString('pt-BR')}
                  </p>
                  <h2 className="text-xl font-serif font-bold text-secondary line-clamp-2">
                    {n.title}
                  </h2>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col flex-1">
                  <p className="text-slate-600 text-sm flex-1">{extractSummary(n.content)}</p>
                  <div className="pt-6 mt-auto">
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/noticias/${n.id}`}>
                        Ler mais <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        {news.length === 0 && (
          <p className="text-center text-slate-500 mt-12">Nenhuma notícia publicada ainda.</p>
        )}
      </section>
    </div>
  )
}
