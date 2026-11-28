/**
 * Utilitário compartilhado de EXTENSÃO de contract_end_date.
 *
 * Centraliza a regra da data final do contrato, usada pelo webhook do iPag
 * (POST e GET) e por ativar_assinatura — que antes tinham cópias divergentes.
 * A duplicação foi o que gerou contract_end_date 2028 em conta MENSAL: duas
 * entregas concorrentes do webhook leram o payment como "não pago" antes de
 * qualquer save e cada uma somou +1 mês.
 *
 * REGRA (v0.0.416): webhook de pagamento confirmado é o ÚNICO escritor
 * automático da data (além da edição manual do admin). Free/vencido →
 * hoje + 1 ciclo; renovação de Prata/Ouro com contrato vigente soma a partir
 * da data atual.
 *
 * Padrão do projeto (pricing_lib.js / magazine_lib.js / email_template_lib.js):
 * funções top-level NOMEADAS, consumidas dentro dos callbacks de hook sem
 * require (a JSVM não enxerga require/imports; enxerga função top-level
 * declarada em outro arquivo do mesmo pb_hooks).
 */

/** Hoje em partes civis de São Paulo (UTC-3 fixo). */
function contractSpToday() {
  var now = new Date()
  var utc = now.getTime() + now.getTimezoneOffset() * 60000
  var sp = new Date(utc - 3 * 3600000)
  return {
    year: sp.getUTCFullYear(),
    month: sp.getUTCMonth() + 1,
    day: sp.getUTCDate(),
  }
}

function contractParseYMD(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(String(dateStr))) return null
  var p = String(dateStr).substring(0, 10).split('-')
  var y = parseInt(p[0], 10)
  var m = parseInt(p[1], 10)
  var d = parseInt(p[2], 10)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  return { year: y, month: m, day: d }
}

function contractToYMD(p) {
  return (
    p.year +
    '-' +
    (p.month < 10 ? '0' + p.month : '' + p.month) +
    '-' +
    (p.day < 10 ? '0' + p.day : '' + p.day)
  )
}

function contractIsAfter(a, base) {
  if (a.year !== base.year) return a.year > base.year
  if (a.month !== base.month) return a.month > base.month
  return a.day > base.day
}

/**
 * Calcula a nova contract_end_date.
 * @param {string} currentEndDate data atual (YYYY-MM-DD[...]) ou ''
 * @param {string} billingCycle 'monthly' | 'yearly' (default: monthly)
 * @param {boolean} activePaidRenewal true quando é renovação de Prata/Ouro com
 *        contrato vigente — soma a partir da data atual; false (Free, data
 *        vazia ou vencida) soma a partir de HOJE.
 * @returns {string} nova data YYYY-MM-DD
 */
function extContractEnd(currentEndDate, billingCycle, activePaidRenewal) {
  var today = contractSpToday()
  var cur = contractParseYMD(currentEndDate)

  // Renovação de contrato vigente soma a partir da data atual; caso contrário
  // (Free, data vazia ou vencida) a base é hoje — a data nunca regride.
  var base = today
  if (activePaidRenewal && cur && contractIsAfter(cur, today)) {
    base = { year: cur.year, month: cur.month, day: cur.day }
  }

  if ((billingCycle || 'monthly') === 'yearly') {
    base.year += 1
  } else {
    base.month += 1
    if (base.month > 12) {
      base.year += 1
      base.month = 1
    }
  }
  var daysInMonth = new Date(Date.UTC(base.year, base.month, 0)).getUTCDate()
  if (base.day > daysInMonth) base.day = daysInMonth
  return contractToYMD(base)
}

/**
 * Guard de idempotência para entregas concorrentes do webhook: marca a payment
 * como "em processamento" e devolve true se esta chamada é a PRIMEIRA nos
 * últimos 30s. Se devolver false, o chamador NÃO deve estender contrato nem
 * reenviar e-mail — só atualizar campos do payment.
 * @param {string} paymentId
 * @returns {boolean}
 */
function claimContractExt(paymentId) {
  try {
    var store = $app.store()
    var key = 'contract_ext_' + String(paymentId)
    var existing = store.get(key)
    var nowTs = Date.now()
    if (existing && typeof existing === 'number' && nowTs - existing < 30 * 1000) {
      return false
    }
    store.set(key, nowTs)
    return true
  } catch (_) {
    // Sem store disponível: mantém comportamento legado (permite estender).
    return true
  }
}
