// Store compartilhado do acesso do aluno (tier + pagamentos + assinaturas).
// Busca os dados UMA vez e compartilha entre todos os componentes da página —
// elimina o N+1 em que cada card/curso/revista disparava 2 requisições
// (payments + subscriptions). TTL curto evita estado velho; invalidação
// explícita após confirmação de pagamento (notifyStudentAccessChanged).
import pb from '@/lib/pocketbase/client'

export interface StudentAccessPayment {
  id: string
  status: string
  created: string
  product_type?: string
  course_id?: string
  magazine_id?: string
}

export interface StudentAccessData {
  payments: StudentAccessPayment[]
  subscriptions: unknown[]
}

interface CacheEntry {
  data: StudentAccessData
  expiresAt: number
  inflight: Promise<StudentAccessData> | null
}

const TTL_MS = 60_000 // 1 minuto — curto de propósito (muda após compra)
const cache = new Map<string, CacheEntry>()
const listeners = new Set<(userId: string | null) => void>()

function currentUserId(): string | null {
  try {
    return pb.authStore.record?.id ?? null
  } catch {
    return null
  }
}

export function clearStudentAccessCache(userId?: string): void {
  if (userId) {
    cache.delete(userId)
  } else {
    cache.clear()
  }
  const uid = userId ?? currentUserId()
  listeners.forEach((l) => l(uid))
}

/** Chamar após confirmação de pagamento/ativação de assinatura. */
export function notifyStudentAccessChanged(): void {
  clearStudentAccessCache()
}

export function subscribeStudentAccess(listener: (userId: string | null) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function getStudentAccessData(userId: string): Promise<StudentAccessData> {
  const entry = cache.get(userId)
  const now = Date.now()
  if (entry && entry.expiresAt > now) return entry.data
  if (entry?.inflight) return entry.inflight

  const inflight = Promise.all([
    pb.collection('payments').getFullList({
      filter: `user='${userId}'`,
      sort: '-created',
      requestKey: `student-access-payments-${userId}`,
    }),
    pb.collection('subscriptions').getFullList({
      filter: `user = '${userId}'`,
      sort: '-created',
      expand: 'plan',
      requestKey: `student-access-subs-${userId}`,
    }),
  ])
    .then(([payments, subs]) => {
      const data: StudentAccessData = {
        payments: payments.map((p) => ({
          id: p.id,
          status: String(p.status || ''),
          created: String(p.created || ''),
          product_type: p.product_type ? String(p.product_type) : undefined,
          course_id: p.course_id ? String(p.course_id) : undefined,
          magazine_id: p.magazine_id ? String(p.magazine_id) : undefined,
        })),
        subscriptions: subs,
      }
      cache.set(userId, { data, expiresAt: Date.now() + TTL_MS, inflight: null })
      return data
    })
    .catch((err) => {
      // Não deixa inflight preso em erro — próxima chamada tenta de novo.
      const e = cache.get(userId)
      if (e) e.inflight = null
      throw err
    })

  if (cache.has(userId)) {
    cache.get(userId)!.inflight = inflight
  } else {
    cache.set(userId, { data: { payments: [], subscriptions: [] }, expiresAt: 0, inflight })
  }
  return inflight
}
