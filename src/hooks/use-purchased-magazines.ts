// Hook: edições compradas (payments status='paid' com magazine_id) do usuário.
// "Minhas revistas" da área do aluno. Usa o STORE COMPARTILHADO de acesso
// (uma única busca de payments por TTL, compartilhada com todos os componentes)
// — não dispara mais uma requisição própria por tela/componente. Recarrega
// quando userId muda, quando refreshKey muda (após confirmação de pagamento)
// ou quando o store é invalidado externamente.
import { useEffect, useMemo, useState } from 'react'
import {
  getStudentAccessData,
  subscribeStudentAccess,
  clearStudentAccessCache,
  type StudentAccessPayment,
} from '@/lib/student-access-store'

export interface PurchasedMagazine {
  paymentId: string
  magazineId: string
  purchasedAt: string
}

function toPurchased(payments: StudentAccessPayment[]): PurchasedMagazine[] {
  return payments
    .filter((p) => p.status === 'paid' && p.magazine_id)
    .map((p) => ({
      paymentId: p.id,
      magazineId: p.magazine_id as string,
      purchasedAt: p.created,
    }))
}

export function usePurchasedMagazines(userId: string | undefined, refreshKey: number) {
  const [purchased, setPurchased] = useState<PurchasedMagazine[]>([])
  const [loading, setLoading] = useState(!!userId)

  useEffect(() => {
    if (!userId) {
      setPurchased([])
      setLoading(false)
      return
    }
    let vivo = true
    setLoading(true)
    const load = () =>
      getStudentAccessData(userId)
        .then((d) => vivo && setPurchased(toPurchased(d.payments)))
        .catch(() => vivo && setPurchased([]))
        .finally(() => vivo && setLoading(false))
    load()
    // Invalidação externa (compra confirmada): relê do store já atualizado.
    const unsub = subscribeStudentAccess((changedUserId) => {
      if (changedUserId !== userId) return
      load()
    })
    return () => {
      vivo = false
      unsub()
    }
  }, [userId])

  // refreshKey (após pagamento confirmado) força revalidação no servidor —
  // derruba o cache do usuário antes de reler (senão viria dado velho do TTL).
  useEffect(() => {
    if (!userId || refreshKey === 0) return
    clearStudentAccessCache(userId)
    setLoading(true)
    getStudentAccessData(userId)
      .then((d) => setPurchased(toPurchased(d.payments)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [refreshKey, userId])

  return { purchased, loading }
}

export function isMagazinePurchased(purchased: PurchasedMagazine[], magazineId: string): boolean {
  return purchased.some((p) => p.magazineId === magazineId)
}
