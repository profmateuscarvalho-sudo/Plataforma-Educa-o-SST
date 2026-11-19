import { describe, it, expect } from 'vitest'
import {
  tierLevel,
  effectiveTier,
  canAccessCourse,
  canAccessMagazine,
  canAccessLive,
  canAccessDocumentary,
  hasMentorshipDiscount,
  mentorshipDiscountedPrice,
  MENTORSHIP_DISCOUNT,
  type AccessTier,
} from './plan-access'

const iso = (d: string) => new Date(d).toISOString()

describe('effectiveTier', () => {
  it('visitante = none', () => {
    expect(effectiveTier(null, [], false)).toBe('none')
  })

  it('admin sempre ouro', () => {
    const u = { id: 'u1', role: 'admin', plan_tier: 'free' }
    expect(effectiveTier(u, [], false)).toBe('ouro')
  })

  it('assinatura ativa prata sobe o tier de usuário free', () => {
    const u = { id: 'u1', plan_tier: 'free' }
    const subs = [{ status: 'active', expand: { plan: { name: 'Plano Prata', price: 297 } } }]
    expect(effectiveTier(u, subs, false)).toBe('prata')
  })

  it('assinatura ouro vence a prata e o plan_tier do usuário', () => {
    const u = { id: 'u1', plan_tier: 'prata' }
    const subs = [
      { status: 'active', expand: { plan: { name: 'Prata', price: 297 } } },
      { status: 'active', expand: { plan: { name: 'Ouro', price: 497 } } },
    ]
    expect(effectiveTier(u, subs, false)).toBe('ouro')
  })

  it('assinatura com contract_end_date vencido NÃO sobe o tier (vencido = Free)', () => {
    const u = { id: 'u1', plan_tier: 'free' }
    const subs = [
      {
        status: 'active',
        expand: { plan: { name: 'Prata', price: 297 } },
        contract_end_date: iso('2020-01-01T12:00:00Z'),
      },
    ]
    expect(effectiveTier(u, subs, false)).toBe('free')
  })

  it('usuário prata com contract_end_date vencido cai para free', () => {
    const u = { id: 'u1', plan_tier: 'prata', contract_end_date: iso('2020-01-01') }
    expect(effectiveTier(u, [], false)).toBe('free')
  })

  it('usuário prata com contract_end_date futuro mantém prata', () => {
    const u = { id: 'u1', plan_tier: 'prata', contract_end_date: iso('2099-01-01') }
    expect(effectiveTier(u, [], false)).toBe('prata')
  })

  it('pagamento avulso aprovado garante pelo menos Free para visitante sem plano', () => {
    const u = { id: 'u1', plan_tier: '' }
    expect(effectiveTier(u, [], true)).toBe('free')
  })
})

describe('matriz de acesso por perfil', () => {
  const mk = (tier: AccessTier, contract?: string) => ({
    id: 'u-' + tier,
    plan_tier: tier,
    contract_end_date: contract,
  })
  const free = mk('free')
  const prata = mk('prata', iso('2099-01-01'))
  const ouro = mk('ouro', iso('2099-01-01'))
  const admin = { id: 'a1', role: 'admin' }

  it('Free: só curso gratuito ou comprado avulso', () => {
    expect(canAccessCourse('free', { id: 'c1', is_free: true })).toBe(true)
    expect(canAccessCourse('free', { id: 'c2', is_free: false })).toBe(false)
    expect(canAccessCourse('free', { id: 'c2', is_free: false }, ['c2'])).toBe(true)
    // pending não é compra: não libera
    expect(canAccessCourse('free', { id: 'c3', is_free: false }, [])).toBe(false)
  })

  it('Prata acessa curso pago, revista, live e documentário não gratuito', () => {
    expect(canAccessCourse('prata', { id: 'c2', is_free: false })).toBe(true)
    expect(canAccessMagazine('prata')).toBe(true)
    expect(canAccessLive('prata')).toBe(true)
    expect(canAccessDocumentary('prata', { is_free: false })).toBe(true)
  })

  it('Ouro tem acesso digital igual ao Prata (BOX impresso é físico)', () => {
    expect(canAccessCourse('ouro', { id: 'c2', is_free: false })).toBe(true)
    expect(canAccessMagazine('ouro')).toBe(true)
    expect(canAccessLive('ouro')).toBe(true)
    expect(canAccessDocumentary('ouro', { is_free: false })).toBe(true)
  })

  it('Free não acessa revista, live nem documentário pago', () => {
    expect(canAccessMagazine('free')).toBe(false)
    expect(canAccessLive('free')).toBe(false)
    expect(canAccessDocumentary('free', { is_free: false })).toBe(false)
    expect(canAccessDocumentary('free', { is_free: true })).toBe(true)
  })

  it('admin acessa tudo', () => {
    expect(effectiveTier(admin, [], false)).toBe('ouro')
    expect(canAccessMagazine('ouro')).toBe(true)
    expect(canAccessCourse('ouro', { id: 'c9', is_free: false })).toBe(true)
  })
})

describe('mentoria', () => {
  it('desconto só para prata/ouro/admin (via tier ouro/prata)', () => {
    expect(hasMentorshipDiscount('free')).toBe(false)
    expect(hasMentorshipDiscount('prata')).toBe(true)
    expect(hasMentorshipDiscount('ouro')).toBe(true)
  })

  it('calcula 30% off arredondando para 2 casas', () => {
    expect(MENTORSHIP_DISCOUNT).toBe(0.3)
    expect(mentorshipDiscountedPrice(100)).toBe(70)
    expect(mentorshipDiscountedPrice(297.5)).toBe(208.25)
  })
})
