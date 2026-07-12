import { useEffect, useState } from 'react'
import { getNews } from '@/services/news'
import { News } from '@/types'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Newspaper } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NewsSidebar() {
  const [news, setNews] = useState<News[]>([])
  const [selected, setSelected] = useState<News | null>(null)

  useEffect(() => {
    getNews()
      .then(setNews)
      .catch(() => {})
  }, [])

  const getImage = (item: News): string | null => {
    if (Array.isArray(item.image) && item.image.length > 0) {
      return pb.files.getUrl(item, item.image[0])
    }
    if (typeof item.image === 'string' && item.image) {
      return pb.files.getUrl(item, item.image)
    }
    if (item.images && item.images.length > 0) {
      return pb.files.getUrl(item, item.images[0])
    }
    return null
  }

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col max-h-[70vh]">
        <div className="flex items-center gap-2 p-3 border-b border-white/10">
          <Newspaper className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white/90">Notícias</h3>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 p-2">
          {news.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-6">Nenhuma notícia.</p>
          ) : (
            news.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelected(n)}
                className="w-full text-left p-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
              >
                <p className="text-sm font-medium text-white/80 line-clamp-2">{n.title}</p>
                <p className="text-xs text-white/30 mt-1">
                  {format(new Date(n.created), 'dd MMM', { locale: ptBR })}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-900 border-white/10">
          <DialogTitle className="text-xl font-bold text-white">{selected?.title}</DialogTitle>
          {selected && getImage(selected) && (
            <img
              src={getImage(selected)!}
              alt={selected.title}
              className="w-full max-h-64 object-cover rounded-lg"
            />
          )}
          {selected && (
            <div
              className="prose prose-invert prose-sm max-w-none text-white/70"
              dangerouslySetInnerHTML={{ __html: selected.content }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
