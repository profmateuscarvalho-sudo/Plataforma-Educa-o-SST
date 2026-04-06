import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { getNews } from '@/services/news'
import { News } from '@/types'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'

export default function Noticias() {
  const [news, setNews] = useState<News[]>([])

  useEffect(() => {
    getNews().then(setNews).catch(console.error)
  }, [])

  const handleShare = (id: string) => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: 'Link copiado!',
      description: 'Você pode compartilhar esta notícia com sua rede.',
    })
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

      <section className="container px-4 pt-16 max-w-4xl mx-auto space-y-12">
        {news.map((n) => {
          const imgUrl = n.image
            ? pb.files.getUrl(n, n.image)
            : 'https://img.usecurling.com/p/800/400?q=industry&color=gray'
          return (
            <Card key={n.id} className="overflow-hidden border-none shadow-md bg-white">
              <img src={imgUrl} alt={n.title} className="w-full h-64 object-cover" />
              <CardHeader>
                <h2 className="text-2xl font-serif font-bold text-secondary">{n.title}</h2>
                <p className="text-sm text-slate-400">
                  {new Date(n.created).toLocaleDateString('pt-BR')}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="prose max-w-none text-slate-600"
                  dangerouslySetInnerHTML={{ __html: n.content }}
                />
                <div className="pt-4 flex border-t">
                  <Button variant="outline" size="sm" onClick={() => handleShare(n.id)}>
                    <Share2 className="w-4 h-4 mr-2" /> Compartilhar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {news.length === 0 && (
          <p className="text-center text-slate-500">Nenhuma notícia publicada ainda.</p>
        )}
      </section>
    </div>
  )
}
