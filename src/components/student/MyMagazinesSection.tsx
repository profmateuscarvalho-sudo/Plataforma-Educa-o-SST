// Seção "Minhas revistas" do Hub do aluno: edições compradas avulsamente
// (payments status='paid' com magazine_id). Fica escondida quando não há
// nenhuma edição comprada e também para assinantes Prata/Ouro (que já têm
// acesso a tudo). O nome da edição vem da própria revista pelo expansão do
// campo magazine_id (via getFullList com expand).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Newspaper, BookOpen } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { usePurchasedMagazines, PurchasedMagazine } from '@/hooks/use-purchased-magazines'
import { extractMagazineIssueNumber } from '@/lib/magazine-utils'
import { Magazine } from '@/types'

interface PurchasedMagazineItem {
  magazineId: string
  title: string
  thumbnailUrl?: string
  issueLabel: string
  purchasedAt: string
}

function buildItems(
  purchased: PurchasedMagazine[],
  magazines: Magazine[],
): PurchasedMagazineItem[] {
  return purchased
    .map((p) => {
      const mag = magazines.find((m) => m.id === p.magazineId)
      if (!mag) return null
      const issueNumber = extractMagazineIssueNumber(mag.title)
      return {
        magazineId: mag.id,
        title: mag.title,
        thumbnailUrl: mag.thumbnail ? pb.files.getUrl(mag, mag.thumbnail) : undefined,
        issueLabel: issueNumber ? `Edição ${issueNumber}` : 'Edição avulsa',
        purchasedAt: p.purchasedAt,
      }
    })
    .filter((x): x is PurchasedMagazineItem => x !== null)
}

export function MyMagazinesSection({
  userId,
  hide,
}: {
  userId: string | undefined
  hide: boolean
}) {
  const navigate = useNavigate()
  const { purchased, loading } = usePurchasedMagazines(userId, 0)
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [magsLoading, setMagsLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setMagsLoading(true)
    pb.collection('magazines')
      .getFullList<Magazine>({ sort: '-created' })
      .then((recs) => alive && setMagazines(recs))
      .catch(() => alive && setMagazines([]))
      .finally(() => alive && setMagsLoading(false))
    return () => {
      alive = false
    }
  }, [])

  if (hide) return null

  const loadingAny = loading || magsLoading
  const items = buildItems(purchased, magazines)
  // Sem compra nenhuma, a seção inteira desaparece do dashboard.
  if (!loadingAny && items.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-4 h-4 text-primary" />
        <h2 className="font-serif text-lg font-bold text-foreground">Minhas revistas</h2>
      </div>
      {loadingAny ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-2xl bg-muted animate-pulse border border-border"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={`${item.magazineId}-${item.purchasedAt}`} className="group">
              <button
                type="button"
                onClick={() => navigate(`/plataforma/revista/${item.magazineId}`)}
                className="block w-full text-left"
                aria-label={`Ler ${item.title}`}
              >
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted border border-border shadow-sm group-hover:shadow-[0_18px_40px_rgba(28,27,24,0.12)] transition-all group-hover:-translate-y-1 flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Newspaper className="w-12 h-12 text-muted-foreground/60" />
                  )}
                </div>
                <h3 className="font-serif font-bold text-base text-foreground mt-3 line-clamp-2">
                  {item.title}
                </h3>
                <p className="label-overline text-[10px] mt-1">{item.issueLabel}</p>
              </button>
              <Button
                size="sm"
                onClick={() => navigate(`/plataforma/revista/${item.magazineId}`)}
                className="mt-2 w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9"
              >
                <BookOpen className="w-4 h-4 mr-1.5" /> Ler
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
