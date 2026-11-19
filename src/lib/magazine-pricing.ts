// BLOCO 4 PARTE 2 — preços públicos da venda avulsa da revista.
// Fonte da verdade: GET /backend/v1/magazine-pricing (público, sem auth),
// que devolve current/previous de magazine_landing_page + latest_magazine_id
// (mesma regra do backend: edição do mês = revista publicada mais recente).
// O amount do navegador NUNCA é enviado como preço: o servidor recalcula na
// cobrança (create_payment.js / ipag_payment.js via magazine_lib).
import pb from '@/lib/pocketbase/client'

export interface MagazinePricing {
  current: number
  previous: number
  latestMagazineId: string
}

let cache: { data: MagazinePricing; at: number } | null = null
const CACHE_MS = 60_000

export async function fetchMagazinePricing(): Promise<MagazinePricing> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data
  const res = await pb.send('/backend/v1/magazine-pricing', { method: 'GET' })
  const data: MagazinePricing = {
    current: Number(res?.current) > 0 ? Number(res.current) : 29.9,
    previous: Number(res?.previous) > 0 ? Number(res.previous) : 14.9,
    latestMagazineId: String(res?.latest_magazine_id || ''),
  }
  cache = { data, at: Date.now() }
  return data
}

export function clearMagazinePricingCache() {
  cache = null
}

export function formatBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

// Preço da edição: a mais recente publicada é a "edição do mês"; as demais são
// "anteriores". Usa o id vindo do servidor quando disponível.
export function priceForEdition(pricing: MagazinePricing | null, magazineId: string): number {
  if (!pricing) return 0
  return pricing.latestMagazineId && pricing.latestMagazineId === magazineId
    ? pricing.current
    : pricing.previous
}
