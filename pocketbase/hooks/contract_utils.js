/**
 * Utilitário compartilhado de EXTENSÃO de contract_end_date — lib global.
 *
 * Centraliza a regra "a data final nunca regride e o ciclo é somado ao que já
 * existe", usada pelo webhook do iPag (POST e GET), por ativar_assinatura, por
 * check_pending_status e por on_email_verified, que tinham cópias divergentes
 * desta lógica. A duplicação foi o que gerou contract_end_date 2028 em conta
 * MENSAL: duas entregas concorrentes do webhook leram o payment como "não
 * pago" antes de qualquer save e cada uma somou +1 mês.
 *
 * Regras:
 *  - base = máx(contrato atual, hoje em SP) — a data nunca regride;
 *  - mensal soma 1 mês, anual soma 1 ano (dia é clampado ao fim do mês);
 *  - guard de reentrância em $app.store(): se a MESMA payment foi processada
 *    há menos de 30s, a segunda entrega NÃO estende contrato (proteção contra
 *    entregas concorrentes do webhook, que leem o status antigo antes de
 *    qualquer save).
 *
 * Padrão do projeto (pricing_lib.js / magazine_lib.js / email_template_lib.js):
 * global var + IIFE, SEM import/require (a JSVM do pb_hooks não aceita) e sem
 * uso de $app no boot. Consumo dentro de um callback de hook:
 *   var novaData = contractUtils.extend('2026-11-19', 'monthly')
 *   var podeProcessar = contractUtils.claim('PAYMENT_ID')
 */
var contractUtils = (function () {
  var CLAIM_TTL_MS = 30 * 1000

  function spbNowParts() {
    var now = new Date()
    var utc = now.getTime() + now.getTimezoneOffset() * 60000
    var sp = new Date(utc - 3 * 3600000)
    return {
      year: sp.getUTCFullYear(),
      month: sp.getUTCMonth() + 1,
      day: sp.getUTCDate(),
    }
  }

  function parseYMD(dateStr) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(String(dateStr))) return null
    var p = String(dateStr).substring(0, 10).split('-')
    var y = parseInt(p[0], 10)
    var m = parseInt(p[1], 10)
    var d = parseInt(p[2], 10)
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null
    return { year: y, month: m, day: d }
  }

  function toStr(p) {
    return (
      p.year +
      '-' +
      (p.month < 10 ? '0' + p.month : '' + p.month) +
      '-' +
      (p.day < 10 ? '0' + p.day : '' + p.day)
    )
  }

  function isAfter(a, base) {
    if (a.year !== base.year) return a.year > base.year
    if (a.month !== base.month) return a.month > base.month
    return a.day > base.day
  }

  function clampDay(year, month, day) {
    var daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return day > daysInMonth ? daysInMonth : day
  }

  /**
   * Calcula a nova contract_end_date: base = máx(contrato atual, hoje em SP);
   * mensal soma 1 mês, anual soma 1 ano (dia clampado ao fim do mês).
   * @param {string} currentEndDate data atual (YYYY-MM-DD[...]) ou ''
   * @param {string} billingCycle 'monthly' | 'yearly' (default: monthly)
   * @returns {string} nova data YYYY-MM-DD
   */
  function extend(currentEndDate, billingCycle) {
    var today = spbNowParts()
    var cur = parseYMD(currentEndDate)

    var base =
      cur && isAfter(cur, today)
        ? { year: cur.year, month: cur.month, day: cur.day }
        : { year: today.year, month: today.month, day: today.day }

    if ((billingCycle || 'monthly') === 'yearly') {
      base.year += 1
    } else {
      base.month += 1
      if (base.month > 12) {
        base.year += 1
        base.month = 1
      }
    }
    base.day = clampDay(base.year, base.month, base.day)
    return toStr(base)
  }

  /**
   * Guard de idempotência para entregas concorrentes: marca a payment como
   * "em processamento" e devolve true se esta chamada é a PRIMEIRA nos últimos
   * 30s. Se devolver false, o chamador NÃO deve estender contrato nem reenviar
   * e-mail — só atualizar campos do payment.
   * @param {string} paymentId
   * @returns {boolean}
   */
  function claim(paymentId) {
    try {
      var store = $app.store()
      var key = 'contract_ext_' + String(paymentId)
      var existing = store.get(key)
      var nowTs = Date.now()
      if (existing && typeof existing === 'number' && nowTs - existing < CLAIM_TTL_MS) {
        return false
      }
      store.set(key, nowTs)
      return true
    } catch (_) {
      // Sem store disponível: mantém comportamento legado (permite estender).
      return true
    }
  }

  return {
    extend: extend,
    claim: claim,
  }
})()
