import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { News } from '@/types'
import pb from '@/lib/pocketbase/client'

function extractSummary(html: string) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').slice(0, 120) + '...'
}

function getNewsImageUrl(n: News): string {
  if (n.image) {
    return pb.files.getUrl(n, n.image as string)
  }
  if (Array.isArray(n.images) && n.images.length > 0) {
    return pb.files.getUrl(n, n.images[0])
  }
  return 'https://img.usecurling.com/p/800/400?q=industry&color=gray'
}

export function NewsCard({ news }: { news: News }) {
  return (
    <Card className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col h-full rounded-2xl">
      <Link to={`/noticias/${news.id}`} className="block shrink-0">
        <img
          src={getNewsImageUrl(news)}
          alt={news.title}
          className="w-full aspect-[4/3] object-cover"
        />
      </Link>
      <CardHeader className="pb-2 shrink-0 px-5 pt-5">
        <p className="text-sm text-primary font-bold mb-3">
          {new Date(news.created).toLocaleDateString('pt-BR')}
        </p>
        <Link to={`/noticias/${news.id}`}>
          <h2 className="text-2xl font-serif font-bold text-secondary line-clamp-2 leading-tight hover:text-primary transition-colors">
            {news.title}
          </h2>
        </Link>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col flex-1 px-5 pb-5">
        <p className="text-slate-600 text-sm flex-1 mb-6 leading-relaxed line-clamp-3">
          {extractSummary(news.content)}
        </p>
        <Button
          variant="outline"
          className="w-full rounded-xl flex items-center justify-center gap-2 h-12 text-base font-medium"
          asChild
        >
          <Link to={`/noticias/${news.id}`}>
            Ler mais <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
