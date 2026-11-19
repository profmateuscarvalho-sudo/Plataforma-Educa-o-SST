// Matriz de acesso por plano — lógica PURA (sem React/PocketBase), para poder ser
// testada isoladamente (plan-access.test.ts) e reutilizada por use-student-access
// e pelas telas. O SERVIDOR (pocketbase/hooks/access_guard.js) já sanear os campos
// protegidos; aqui é apenas a mesma matriz, do lado da tela.
import { isContractActive } from '@/lib/date-utils'

export type AccessTier = 'none' | 'free' | 'prata' | 'ouro'
export type PlanTier = AccessTier

// Desconto de mentoria para assinantes Prata/Ouro (aplicado de fato no SERVIDOR,
// na cobrança; a tela só exibe).
export const MENTORSHIP_DISCOUNT = 0.3

export function tierLevel(tier: string): number {
  switch (tier) {
    case 'ouro':
      return 3
    case 'prata':
      return 2
    case 'free':
      return 1
    default:
      return 0
  }
}

export function tierAllows(tier: string, required: string): boolean {
  return tierLevel(tier) >= tierLevel(required)
}

// Deriva o tier a partir do plano de uma assinatura (expand 'plan').
export function tierFromPlan(
  plan: { name?: string; price?: number } | undefined | null,
): AccessTier | null {
  if (!plan) return null
  const name = String(plan.name || '').toLowerCase()
  const price = Number(plan.price || 0)
  if (name.includes('ouro')) return 'ouro'
  if (name.includes('prata')) return 'prata'
  if (price > 0) return 'prata'
  return null
}

type SubLike = { status: string; expand?: { plan?: { name?: string; price?: number } } }

export function tierFromSubscriptionsList(subs: SubLike[]): AccessTier | null {
  let best: AccessTier | null = null
  for (const s of subs || []) {
    if (s.status !== 'active') continue
    const tier = tierFromPlan((s as any).expand?.plan)
    if (tier && (!best || tierLevel(tier) > tierLevel(best))) best = tier
  }
  return best
}

type UserLike = {
  role?: string
  plan_tier?: string | null
  contract_end_date?: string | null
}

// Tier efetivo: maior entre plan_tier do usuário e assinatura ativa.
// Regras: admin = acesso total; visitante = 'none'; contract_end_date vencido = Free;
// pagamento avulso aprovado garante pelo menos acesso Free (itens comprados à parte).
export function effectiveTier(
  user: UserLike | null | undefined,
  subs: SubLike[],
  hasPaidPayment = false,
): AccessTier {
  if (!user) return 'none'
  if (user.role === 'admin') return 'ouro'
  const fromSubs = tierFromSubscriptionsList(subs)
  const fromUser: AccessTier = (user.plan_tier as AccessTier) || 'free'
  let tier: AccessTier = fromSubs && tierLevel(fromSubs) > tierLevel(fromUser) ? fromSubs : fromUser
  if (tier === 'none' && hasPaidPayment) tier = 'free'
  // Vencido = Free: contract_end_date presente e expirado derruba Prata/Ouro para Free.
  if (
    tier !== 'none' &&
    tier !== 'free' &&
    user.contract_end_date &&
    !isContractActive(user.contract_end_date)
  ) {
    tier = 'free'
  }
  return tier
}

// ---- Matriz por área -------------------------------------------------------

// Cursos: is_free liberado para todos; compra avulsa (payments paid + course_id)
// libera o item; demais cursos exigem Prata (Ouro inclui, é físico igual no digital).
export function canAccessCourse(
  tier: AccessTier,
  course: { id?: string; is_free?: boolean } | null | undefined,
  purchasedCourseIds: string[] = [],
): boolean {
  if (!course) return false
  if (course.is_free) return true
  if (course.id && purchasedCourseIds.includes(course.id)) return true
  return tierAllows(tier, 'prata')
}

// Revistas e aulas ao vivo: somente Prata/Ouro.
export function canAccessMagazine(tier: AccessTier): boolean {
  return tierAllows(tier, 'prata')
}

export function canAccessLive(tier: AccessTier): boolean {
  return tierAllows(tier, 'prata')
}

// Documentários: gratuitos liberados para todos; demais exigem Prata.
export function canAccessDocumentary(
  tier: AccessTier,
  doc: { is_free?: boolean } | null | undefined,
): boolean {
  if (!doc) return false
  return !!doc.is_free || tierAllows(tier, 'prata')
}

// Mentoria: 30% de desconto para Prata/Ouro (valor cobrado é calculado no servidor).
export function hasMentorshipDiscount(tier: AccessTier): boolean {
  return tierAllows(tier, 'prata')
}

export function mentorshipDiscountedPrice(fullPrice: number): number {
  return Math.round(fullPrice * (1 - MENTORSHIP_DISCOUNT) * 100) / 100
}
