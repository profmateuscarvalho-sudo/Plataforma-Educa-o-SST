import pb from '@/lib/pocketbase/client'
import { Payment } from '@/types'

export const getPayments = async () => {
  return await pb.collection('payments').getFullList<Payment>({
    sort: '-created',
    expand: 'user',
  })
}

export const getUserPayments = async (userId: string) => {
  return await pb.collection('payments').getFullList<Payment>({
    filter: `user="${userId}"`,
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
  amount: number
  type: 'card' | 'pix'
  customer: {
    name: string
    cpf_cnpj: string
    email?: string
    phone?: string
  }
  card?: CreatePaymentCard
  product_type?: string
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
