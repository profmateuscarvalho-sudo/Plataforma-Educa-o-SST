// Painel de Vendas (admin) — cliente da rota server-side
// GET /backend/v1/admin/vendas (pocketbase/hooks/admin_vendas.js).
//
// O servidor devolve TUDO JUNTO em poucas consultas (pagamento + aluno +
// nome do produto + vencimento do acesso + cards do topo). O cliente nunca
// baixa listas para enriquecer linhas — paginado no servidor, 50 por página.
import pb from '@/lib/pocketbase/client'

export type VendasPeriodo = 'este_mes' | 'mes_passado' | 'personalizado'
export type VendasTipo = 'subscription' | 'course' | 'magazine' | 'mentorship'
export type VendasStatus = 'paid' | 'pending' | 'failed'
export type VendasForma = 'pix' | 'cartao'

export interface VendasCards {
  receita_mes: number
  receita_total: number
  vendas_mes: number
  ticket_medio: number
  assinantes_ativos: number
  vencendo_30_dias: number
  pagamentos_pendentes: number
}

export interface VendaItem {
  id: string
  created: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | string
  product_type: string
  produto_tipo_label: string
  produto_nome: string
  forma: string
  installments: number
  ipag_id: string
  billing_cycle: string
  promo_applied: boolean
  user_id: string
  aluno: string
  email: string
  telefone: string
  vencimento: string
}

export interface VendasEmailLog {
  id: string
  email_type: string
  recipient_email: string
  recipient_name: string
  sent: boolean
  sent_at: string
  error_message: string
  created: string
}

export interface VendasListResponse {
  page: number
  per_page: number
  totalItems: number
  totalPages: number
  items: VendaItem[]
  cards: VendasCards
}

export interface VendasFiltros {
  periodo?: VendasPeriodo
  /** AAAA-MM-DD — obrigatórios quando periodo = 'personalizado'. */
  start?: string
  end?: string
  tipo?: VendasTipo | ''
  status?: VendasStatus | ''
  forma?: VendasForma | ''
  search?: string
  page?: number
  perPage?: number
}

export interface VendasDetalhe {
  item: VendaItem
  emails: VendasEmailLog[]
}

function qs(filtros: VendasFiltros): string {
  const p = new URLSearchParams()
  const periodo = filtros.periodo || 'este_mes'
  p.set('periodo', periodo)
  if (periodo === 'personalizado') {
    if (filtros.start) p.set('start', filtros.start)
    if (filtros.end) p.set('end', filtros.end)
  }
  if (filtros.tipo) p.set('tipo', filtros.tipo)
  if (filtros.status) p.set('status', filtros.status)
  if (filtros.forma) p.set('forma', filtros.forma)
  if (filtros.search) p.set('search', filtros.search)
  p.set('page', String(filtros.page || 1))
  p.set('per_page', String(filtros.perPage || 50))
  return p.toString()
}

/** Listagem paginada + cards do topo (uma chamada só). */
export async function getVendas(filtros: VendasFiltros = {}): Promise<VendasListResponse> {
  return pb.send<VendasListResponse>(`/backend/v1/admin/vendas?${qs(filtros)}`, {
    method: 'GET',
  })
}

/** Detalhe de um pagamento + histórico de e-mails do aluno. */
export async function getVendaDetalhe(id: string): Promise<VendasDetalhe> {
  return pb.send<VendasDetalhe>(`/backend/v1/admin/vendas?id=${encodeURIComponent(id)}`, {
    method: 'GET',
  })
}

/** Reenvia o e-mail de confirmação do pagamento (server-side, registra em email_logs). */
export async function reenviarEmailConfirmacao(paymentId: string): Promise<void> {
  await pb.send<{ ok: boolean }>('/backend/v1/admin/vendas/resend-email', {
    method: 'POST',
    body: { payment_id: paymentId },
  })
}
