import { useEffect, useState } from 'react'
import { getNews } from '@/services/news'
import { News } from '@/types'
import { NewsCard } from '@/components/NewsCard'
import { PageHeader } from '@/components/PageHeader'
import { useTranslation } from 'react-i18next'

export default function Noticias() {
  const { t } = useTranslation()
  const [news, setNews] = useState<News[]>([])

  useEffect(() => {
    getNews().then(setNews).catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        badge={t('nav.news', 'Notícias do Setor')}
        title={t('noticias.title', 'Notícias em SST')}
        description={t(
          'noticias.subtitle',
          'Fique por dentro das últimas atualizações do mercado de Segurança e Saúde no Trabalho.',
        )}
      />

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
