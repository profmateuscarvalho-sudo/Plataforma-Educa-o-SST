import { describe, it, expect } from 'vitest'
import { calcularPrecosPlanos, calcularPrecosDePlano, round2 } from './pricing'

// Valores de conferência OBRIGATÓRIOS da reestruturação dos planos (Bloco 1).
describe('calcularPrecosPlanos — valores de conferência', () => {
  it('base 14,90 → cartão 178,80 (12x de 14,90) e Pix 144', () => {
    const p = calcularPrecosPlanos(14.9)
    expect(p.installment).toBe(14.9)
    expect(p.yearlyCardTotal).toBe(178.8)
    expect(p.yearlyPixTotal).toBe(144)
    expect(p.monthlyPixEquivalent).toBeCloseTo(12, 5)
  })

  it('base 69,90 → cartão 838,80 (12x de 69,90) e Pix 672', () => {
    const p = calcularPrecosPlanos(69.9)
    expect(p.installment).toBe(69.9)
    expect(p.yearlyCardTotal).toBe(838.8)
    expect(p.yearlyPixTotal).toBe(672)
    expect(p.monthlyPixEquivalent).toBeCloseTo(56, 5)
  })

  it('Free (0) zera tudo', () => {
    const p = calcularPrecosPlanos(0)
    expect(p.yearlyCardTotal).toBe(0)
    expect(p.yearlyPixTotal).toBe(0)
    expect(p.installment).toBe(0)
  })
})

describe('promoção', () => {
  const FUTURO = '2099-12-31 23:59:59.000Z'

  it('promo ativa usa promo_monthly_price e devolve valores sem promo riscados', () => {
    const p = calcularPrecosPlanos(14.9, {
      active: true,
      monthlyPrice: 9.9,
      endsAt: FUTURO,
      label: 'Black Friday',
    })
    expect(p.promoActive).toBe(true)
    expect(p.installment).toBe(9.9)
    expect(p.yearlyCardTotal).toBe(118.8)
    expect(p.yearlyPixTotal).toBe(96)
    // valores sem promoção, pela MESMA função
    expect(p.withoutPromo).toBeDefined()
    expect(p.withoutPromo!.installment).toBe(14.9)
    expect(p.withoutPromo!.yearlyCardTotal).toBe(178.8)
    expect(p.withoutPromo!.yearlyPixTotal).toBe(144)
  })

  it('promo vencida (data no passado, fuso SP) cai para o preço normal', () => {
    const p = calcularPrecosPlanos(14.9, {
      active: true,
      monthlyPrice: 9.9,
      endsAt: '2000-01-01 10:00:00.000Z',
    })
    expect(p.promoActive).toBe(false)
    expect(p.yearlyCardTotal).toBe(178.8)
    expect(p.yearlyPixTotal).toBe(144)
  })

  it('promo sem data de término vale enquanto ativa', () => {
    const p = calcularPrecosPlanos(14.9, { active: true, monthlyPrice: 9.9 })
    expect(p.promoActive).toBe(true)
    expect(p.yearlyCardTotal).toBe(118.8)
  })

  it('promo_inactive=false ignora a promoção', () => {
    const p = calcularPrecosPlanos(14.9, {
      active: false,
      monthlyPrice: 9.9,
      endsAt: FUTURO,
    })
    expect(p.promoActive).toBe(false)
    expect(p.yearlyCardTotal).toBe(178.8)
  })

  it('calcularPrecosDePlano lê direto do registro (campos do PocketBase)', () => {
    const p = calcularPrecosDePlano({
      price: 69.9,
      promo_active: true,
      promo_monthly_price: 49.9,
      promo_ends_at: FUTURO,
      promo_label: 'Black Friday',
    })
    expect(p.promoActive).toBe(true)
    expect(p.installment).toBe(49.9)
    expect(p.yearlyCardTotal).toBe(598.8)
    expect(p.yearlyPixTotal).toBe(480)
    expect(p.withoutPromo!.yearlyCardTotal).toBe(838.8)
    expect(p.withoutPromo!.yearlyPixTotal).toBe(672)
  })
})

describe('round2', () => {
  it('evita erro de ponto flutuante', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })
})
