import { useEffect, useState } from 'react'
import { getNews } from '@/services/news'
import { News } from '@/types'
import { NewsCard } from '@/components/NewsCard'

export default function Noticias() {
  const [news, setNews] = useState<News[]>([])

  useEffect(() => {
    getNews().then(setNews).catch(console.error)
  }, [])

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
          {news.map((n) => (
            <NewsCard key={n.id} news={n} />
          ))}
        </div>
        {news.length === 0 && (
          <p className="text-center text-slate-500 mt-12">Nenhuma notícia publicada ainda.</p>
        )}
      </section>
    </div>
  )
}
