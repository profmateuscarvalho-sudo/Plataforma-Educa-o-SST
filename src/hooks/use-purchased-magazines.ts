// Hook: edições compradas (payments status='paid' com magazine_id) do usuário.
// "Minhas revistas" da área do aluno. Recarrega quando userId muda ou quando
// refreshKey muda (após confirmação de pagamento, para liberar sem reload).
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'

export interface PurchasedMagazine {
  paymentId: string
  magazineId: string
  purchasedAt: string
}

export function usePurchasedMagazines(userId: string | undefined, refreshKey: number) {
  const [purchased, setPurchased] = useState<PurchasedMagazine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setPurchased([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    pb.collection('payments')
      .getFullList({
        filter: `user='${userId}' && status='paid' && magazine_id!=''`,
        sort: '-created',
        requestKey: `purchased-mags-${userId}-${refreshKey}`,
      })
      .then((recs) => {
        if (!alive) return
        setPurchased(
          recs.map((r) => ({
            paymentId: r.id,
            magazineId: String(r.magazine_id || ''),
            purchasedAt: String(r.created || ''),
          })),
        )
      })
      .catch(() => alive && setPurchased([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [userId, refreshKey])

  return { purchased, loading }
}

export function isMagazinePurchased(purchased: PurchasedMagazine[], magazineId: string): boolean {
  return purchased.some((p) => p.magazineId === magazineId)
}
