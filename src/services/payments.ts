import pb from '@/lib/pocketbase/client'
import { Payment } from '@/types'

export interface PagedPayments {
  items: Payment[]
  totalItems: number
}

// Lista paginada no servidor (50 por página) — antes era getFullList com
// expand de user para TODOS os pagamentos, lento com a base crescendo.
export const getPayments = async (page = 1, perPage = 50): Promise<PagedPayments> => {
  const res = await pb.collection('payments').getList<Payment>(page, perPage, {
    sort: '-created',
    expand: 'user',
  })
  return { items: res.items, totalItems: res.totalItems }
}

export const getUserPayments = async (userId: string) => {
  return await pb.collection('payments').getFullList<Payment>({
    filter: `user='${userId}'`,
    sort: '-created',
  })
}

export interface CreatePaymentCard {
  method: string
  token?: string
  holder?: string
  number?: string
  expiry_month?: string
  expiry_year?: string
  cvv?: string
  installments?: number
}

export interface CreatePaymentPayload {
  /** Opcional e IGNORADO para assinatura — o backend recalcula pelo plano (segurança). */
  amount?: number
  type: 'card' | 'pix'
  customer: {
    name: string
    cpf_cnpj: string
    email?: string
    phone?: string
  }
  card?: CreatePaymentCard
  product_type?: string
  plan_id?: string
  billing_cycle?: 'monthly' | 'yearly'
  /** Parcelas do cartão (1-12). Validado no backend. */
  installments?: number
  mentorship_id?: string
  selected_slots?: { date: string; time: string }[]
}

export interface CreatePaymentResponse {
  payment_id: string
  ipag_id: string
  status: 'pending' | 'paid' | 'failed'
  pix?: {
    qrcode: string
    qrcode64: string
    link: string
  }
}

export const createPayment = async (
  payload: CreatePaymentPayload,
): Promise<CreatePaymentResponse> => {
  return await pb.send('/backend/v1/create-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}
