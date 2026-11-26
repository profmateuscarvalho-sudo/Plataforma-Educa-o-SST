// Função ÚNICA de cálculo de preços da reestruturação dos planos.
// Regras (aceitação 4 e 5):
//   base 14,90 → cartão 178,80 (12x de 14,90), Pix 144
//   base 69,90 → cartão 838,80 (12x de 69,90), Pix 672
// Também usada como referência pelo backend (pocketbase/hooks/pricing_lib.js),
// que implementa a MESMA lógica em JSVM.

export interface PromoInfo {
  active: boolean
  monthlyPrice: number
  endsAt?: string
  label?: string
}

export interface PlanPricing {
  /** Valor mensal efetivo (promoção ou base). */
  baseMonthly: number
  /** Valor mensal de referência (sem promoção). */
  referenceMonthly: number
  /** Total anual no cartão = parcela × 12 (máx. 12x sem juros). */
  yearlyCardTotal: number
  /** Valor da parcela mensal no cartão. */
  installment: number
  /** Total à vista no Pix (inteiro, arredondado para CIMA de 80% do cartão). */
  yearlyPixTotal: number
  /** Equivalente mensal no Pix (total Pix ÷ 12, exibição). */
  monthlyPixEquivalent: number
  /** Promoção ativa (promo_active && agora <= promo_ends_at, fuso SP). */
  promoActive: boolean
  /** Valores SEM promoção (para exibir riscados quando promoActive). */
  withoutPromo?: {
    baseMonthly: number
    yearlyCardTotal: number
    installment: number
    yearlyPixTotal: number
    monthlyPixEquivalent: number
  }
}

/** "2026-12-31 00:00:00.000Z" | Date | '' → Date | null */
function parseDbDate(value?: string | Date | null): Date | null {
  if (!value) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

/** Data/hora atual no fuso de São Paulo (UTC-3 fixo), como Date em UTC. */
export function nowInSaoPaulo(): Date {
  const now = new Date()
  return new Date(now.getTime() - 3 * 60 * 60 * 1000)
}

/** Data de término da promoção interpretada no fuso de São Paulo (UTC-3).
 *  "2026-12-31 23:59:59" → 02:59:59Z; vence no fim do dia informado. */
export function promoEndsAtInSaoPaulo(value?: string | Date | null): Date | null {
  const d = parseDbDate(value)
  if (!d) return null
  // Se veio com Z/fuso explícito, já é absoluto; se veio "local" (YYYY-MM-DD…),
  // trata como horário de São Paulo: subtrai o offset para obter o UTC.
  const str = value instanceof Date ? null : String(value)
  if (str && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(str)) {
    return new Date(d.getTime() + 3 * 60 * 60 * 1000)
  }
  return d
}

function isPromoCurrentlyActive(promo: PromoInfo): boolean {
  if (!promo.active) return false
  const now = nowInSaoPaulo()
  const ends = promoEndsAtInSaoPaulo(promo.endsAt)
  if (ends && now > ends) return false
  return true
}

function compute(baseMonthly: number): Omit<PlanPricing, 'promoActive' | 'withoutPromo'> {
  const installment = round2(baseMonthly)
  const yearlyCardTotal = round2(installment * 12)
  const yearlyPixTotal = Math.ceil(yearlyCardTotal * 0.8)
  const monthlyPixEquivalent = round2(yearlyPixTotal / 12)
  return {
    baseMonthly: round2(baseMonthly),
    referenceMonthly: round2(baseMonthly),
    installment,
    yearlyCardTotal,
    yearlyPixTotal,
    monthlyPixEquivalent,
  }
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Calcula todos os valores de um plano a partir do valor mensal de referência
 * (campo `price`) e da promoção (promo_active/promo_monthly_price/promo_ends_at).
 */
export function calcularPrecosPlanos(referenceMonthly: number, promo?: PromoInfo): PlanPricing {
  const base = Math.max(0, referenceMonthly || 0)
  const normal = compute(base)

  const active = promo ? isPromoCurrentlyActive(promo) : false
  if (!active) {
    return { ...normal, baseMonthly: normal.referenceMonthly, promoActive: false }
  }

  const promoBase = Math.max(0, promo!.monthlyPrice || 0)
  const promoPricing = compute(promoBase)
  return {
    ...promoPricing,
    baseMonthly: promoPricing.referenceMonthly,
    referenceMonthly: normal.referenceMonthly,
    promoActive: true,
    withoutPromo: {
      baseMonthly: normal.baseMonthly,
      yearlyCardTotal: normal.yearlyCardTotal,
      installment: normal.installment,
      yearlyPixTotal: normal.yearlyPixTotal,
      monthlyPixEquivalent: normal.monthlyPixEquivalent,
    },
  }
}

/** Overload de conveniência: calcula direto de um registro de plano. */
export function calcularPrecosDePlano(plan: {
  price?: number
  promo_active?: boolean
  promo_monthly_price?: number
  promo_ends_at?: string
  promo_label?: string
}): PlanPricing {
  return calcularPrecosPlanos(plan.price || 0, {
    active: !!plan.promo_active,
    monthlyPrice: plan.promo_monthly_price || 0,
    endsAt: plan.promo_ends_at,
    label: plan.promo_label,
  })
}

/**
 * "Menos de R$ X por dia": total anual ÷ 365, em centavos, arredondado PARA CIMA
 * até a próxima DEZENA de centavos e sempre ESTRITAMENTE acima do valor real
 * (se o real cair exatamente numa dezena, sobe mais uma: 0,40 → 0,50).
 * Ex.: cartão 178,80 → 48,98 cents/dia → 0,50; Pix 144 → 39,45 → 0,40.
 */
export function valorPorDiaMenosDe(totalAnual: number): number {
  const realCentavos = (Math.max(0, totalAnual || 0) / 365) * 100
  let cents = Math.ceil(realCentavos / 10) * 10
  if (cents <= realCentavos) cents += 10
  return cents / 100
}

/** "R$ 1.234,56" (pt-BR). */
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
