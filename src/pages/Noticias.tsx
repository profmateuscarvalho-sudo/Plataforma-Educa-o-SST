import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNews } from '@/services/news'
import { News } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Newspaper, Sparkles } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml } from '@/lib/utils'

function getNewsImageUrl(n: News): string {
  if (n.image) {
    try {
      return pb.files.getUrl(n, n.image as string)
    } catch {
      // fallback
    }
  }
  if (Array.isArray(n.images) && n.images.length > 0) {
    try {
      return pb.files.getUrl(n, n.images[0])
    } catch {
      // fallback
    }
  }
  return 'https://img.usecurling.com/p/800/500?q=safety+industry'
}

function getOneLineSummary(content: string): string {
  const plain = stripHtml(content).replace(/\s+/g, ' ').trim()
  if (plain.length > 140) {
    return plain.slice(0, 140) + '...'
  }
  return plain || 'Acompanhe as principais movimentações e atualizações do setor.'
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace('.', '')
  } catch {
    return ''
  }
}

export default function Noticias() {
  const { t } = useTranslation()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNews()
      .then(setNews)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const featuredNews = news.length > 0 ? news[0] : null
  const regularNews = news.length > 1 ? news.slice(1) : []

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C1B18] pb-24">
      <PageHeader
        badge={t('nav.news', 'Notícias do Setor')}
        title={t('noticias.title', 'Notícias em SST')}
        description={t(
          'noticias.subtitle',
          'Fique por dentro das últimas atualizações do mercado de Segurança e Saúde no Trabalho.',
        )}
      />

      <section className="container mx-auto px-6 pt-12 max-w-[1200px]">
        {loading ? (
          <div className="space-y-8">
            <div className="h-80 bg-white rounded-[28px] border border-[#E4DED1] animate-pulse" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white rounded-2xl border border-[#E4DED1] animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : news.length === 0 ? (
          <div className="max-w-2xl mx-auto my-12 bg-white rounded-[28px] p-8 sm:p-14 text-center border border-[#E4DED1] shadow-[0_16px_36px_rgba(28,27,24,0.06)]">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F3] border border-[#E4DED1] flex items-center justify-center text-[#173F33] mb-6">
              <Newspaper className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-3xl font-semibold text-[#1C1B18] mb-2">
              Nenhuma notícia publicada ainda
            </h3>
            <p className="text-base sm:text-lg text-[#5F5A4F] leading-relaxed max-w-md mx-auto">
              Em breve nossa redação publicará as principais novidades e análises de SST.
            </p>
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            {/* Notícia mais recente abre a página EM DESTAQUE, com imagem grande */}
            {featuredNews && (
              <div className="bg-white rounded-[28px] border border-[#E4DED1] overflow-hidden shadow-[0_16px_36px_rgba(28,27,24,0.06)] group hover:shadow-xl transition-all duration-300">
                <Link to={`/noticias/${featuredNews.id}`} className="block">
                  <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[460px] overflow-hidden bg-[#FAF8F3]">
                    <img
                      src={getNewsImageUrl(featuredNews)}
                      alt={featuredNews.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-white space-y-3 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FDBE2D] text-[#1C1B18] shadow-sm">
                          <Sparkles className="w-3.5 h-3.5" />
                          Destaque da Redação
                        </span>
                        {featuredNews.category && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white">
                            {featuredNews.category}
                          </span>
                        )}
                        <span className="text-xs sm:text-sm text-white/80 font-mono">
                          {formatDate(featuredNews.created)}
                        </span>
                      </div>

                      <h2 className="title-h2-fluid text-white font-serif font-semibold leading-tight line-clamp-2">
                        {featuredNews.title}
                      </h2>

                      <p className="text-sm sm:text-base text-white/90 line-clamp-2 font-normal leading-relaxed">
                        {getOneLineSummary(featuredNews.content)}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="p-6 sm:p-8 flex items-center justify-between border-t border-[#E4DED1] bg-[#FAF8F3]">
                  <span className="text-xs sm:text-sm text-[#5F5A4F] font-medium">
                    Cobertura e análise editorial
                  </span>
                  <Button
                    asChild
                    className="rounded-full font-bold bg-[#1C1B18] hover:bg-[#1C1B18]/90 text-[#FAF8F3] h-11 px-6 text-sm"
                  >
                    <Link
                      to={`/noticias/${featuredNews.id}`}
                      className="inline-flex items-center gap-2"
                    >
                      <span>Ler reportagem completa</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Lista editorial: data, manchete em Playfair, resumo em uma linha e miniatura à direita */}
            {regularNews.length > 0 && (
              <div className="space-y-6">
                <div className="border-b border-[#E4DED1] pb-3 flex items-center justify-between">
                  <span className="label-overline">EDIÇÕES ANTERIORES</span>
                  <span className="text-xs font-medium text-[#7F7869]">
                    {regularNews.length} publicações
                  </span>
                </div>

                <div className="divide-y divide-[#E4DED1]">
                  {regularNews.map((item) => (
                    <Link
                      key={item.id}
                      to={`/noticias/${item.id}`}
                      className="group block py-6 sm:py-8 transition-all duration-300 hover:translate-x-2"
                    >
                      <div className="flex items-center justify-between gap-6 sm:gap-8">
                        {/* Esquerda: data, manchete em Playfair e resumo em uma linha */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#7F7869] font-mono uppercase tracking-wider">
                              {formatDate(item.created)}
                            </span>
                            {item.category && (
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#173F33] bg-[#E4DED1]/50 px-2 py-0.5 rounded-full">
                                {item.category}
                              </span>
                            )}
                          </div>

                          <h3 className="font-serif text-xl sm:text-2xl md:text-[26px] font-semibold text-[#1C1B18] group-hover:text-[#173F33] transition-colors leading-snug line-clamp-2">
                            {item.title}
                          </h3>

                          <p className="text-sm sm:text-base text-[#5F5A4F] line-clamp-1 leading-relaxed font-normal">
                            {getOneLineSummary(item.content)}
                          </p>
                        </div>

                        {/* Direita: miniatura da imagem (aspect-video ou 4/3 ~120-160px) + seta */}
                        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                          <div className="w-24 sm:w-36 md:w-44 aspect-[16/10] rounded-xl overflow-hidden bg-[#FAF8F3] border border-[#E4DED1] shrink-0">
                            <img
                              src={getNewsImageUrl(item)}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>

                          <div className="text-[#1C1B18] group-hover:text-[#173F33] transition-transform group-hover:translate-x-1 shrink-0 hidden sm:block">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
