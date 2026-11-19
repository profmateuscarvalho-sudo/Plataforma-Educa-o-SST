// pricing_lib.js — MESMA lógica de src/lib/pricing.ts, em JSVM (pb_hooks).
// JSVM não suporta imports npm: tudo via globais $app/console, padrão dos
// hooks existentes. Frontend e backend precisam dar exatamente o mesmo
// resultado (aceitação 5).
//
// Entrada: valor mensal de referência (campo `price`) + promoção.
//   cartão: parcela = base; total = parcela × 12 (máx. 12x sem juros)
//   Pix: ceil(total cartão × 0.80), reais inteiros
//
// Conferência obrigatória:
//   14.90 → cartão 178.80 (12x 14.90), Pix 144
//   69.90 → cartão 838.80 (12x 69.90), Pix 672

var pricingLib = (function () {
  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100
  }

  function parseDbDate(value) {
    if (!value) return null
    var d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }

  // Data/hora atual no fuso de São Paulo (UTC-3 fixo), como Date em UTC.
  function nowInSaoPaulo() {
    return new Date(Date.now() - 3 * 60 * 60 * 1000)
  }

  // Data de término interpretada no fuso de São Paulo quando "local".
  function promoEndsAtInSaoPaulo(value) {
    var d = parseDbDate(value)
    if (!d) return null
    var str = value instanceof Date ? null : String(value)
    if (str && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(str)) {
      return new Date(d.getTime() + 3 * 60 * 60 * 1000)
    }
    return d
  }

  function isPromoActive(promo) {
    if (!promo || !promo.active) return false
    var now = nowInSaoPaulo()
    var ends = promoEndsAtInSaoPaulo(promo.endsAt)
    if (ends && now > ends) return false
    return true
  }

  function compute(baseMonthly) {
    var installment = round2(baseMonthly)
    var yearlyCardTotal = round2(installment * 12)
    var yearlyPixTotal = Math.ceil(yearlyCardTotal * 0.8)
    var monthlyPixEquivalent = round2(yearlyPixTotal / 12)
    return {
      baseMonthly: round2(baseMonthly),
      referenceMonthly: round2(baseMonthly),
      installment: installment,
      yearlyCardTotal: yearlyCardTotal,
      yearlyPixTotal: yearlyPixTotal,
      monthlyPixEquivalent: monthlyPixEquivalent,
    }
  }

  // API pública — espelha calcularPrecosPlanos do frontend.
  function calcularPrecos(referenceMonthly, promo) {
    var base = Math.max(0, referenceMonthly || 0)
    var normal = compute(base)
    var active = isPromoActive(promo)
    if (!active) {
      var out = compute(normal.referenceMonthly)
      out.promoActive = false
      return out
    }
    var promoBase = Math.max(0, (promo && promo.monthlyPrice) || 0)
    var promoPricing = compute(promoBase)
    promoPricing.referenceMonthly = normal.referenceMonthly
    promoPricing.promoActive = true
    promoPricing.withoutPromo = {
      baseMonthly: normal.baseMonthly,
      yearlyCardTotal: normal.yearlyCardTotal,
      installment: normal.installment,
      yearlyPixTotal: normal.yearlyPixTotal,
      monthlyPixEquivalent: normal.monthlyPixEquivalent,
    }
    return promoPricing
  }

  // Conveniência: calcula direto de um registro de plano (campos PocketBase).
  function calcularPrecosDePlano(plan) {
    return calcularPrecos(plan && plan.price, {
      active: !!(plan && plan.promo_active),
      monthlyPrice: (plan && plan.promo_monthly_price) || 0,
      endsAt: plan && plan.promo_ends_at,
      label: plan && plan.promo_label,
    })
  }

  return {
    round2: round2,
    calcularPrecos: calcularPrecos,
    calcularPrecosDePlano: calcularPrecosDePlano,
    isPromoActive: isPromoActive,
  }
})()

// Validação de conferência no boot da JSVM — falha ruidosa se divergir
// do frontend (mesmos valores do teste automatizado do pricing).
;(function validatePricingLib() {
  var checks = [
    { base: 14.9, card: 178.8, pix: 144 },
    { base: 69.9, card: 838.8, pix: 672 },
  ]
  for (var i = 0; i < checks.length; i++) {
    var c = checks[i]
    var r = pricingLib.calcularPrecos(c.base)
    if (r.yearlyCardTotal !== c.card || r.yearlyPixTotal !== c.pix) {
      throw new Error(
        'pricing_lib.js fora de sincronia com src/lib/pricing.ts: base=' +
          c.base +
          ' esperado cartão=' +
          c.card +
          '/Pix=' +
          c.pix +
          ', obtido cartão=' +
          r.yearlyCardTotal +
          '/Pix=' +
          r.yearlyPixTotal,
      )
    }
  }
  console.log('[pricing_lib] validação de conferência OK (14.90→178.80/144; 69.90→838.80/672)')
})()
