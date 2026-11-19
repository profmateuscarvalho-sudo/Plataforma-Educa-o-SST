// ---------------------------------------------------------------------------
// BLOCO 4 — Compra avulsa da revista: resolução de PREÇO no servidor.
//
// "Edição do mês" = a revista publicada mais recente (maior 'created'); todas
// as outras = "anteriores". Os preços vêm de magazine_landing_page (registro
// semeado pela migração 0135):
//   - current_issue_price  (padrão 29.90)
//   - previous_issue_price (padrão 14.90)
// e são SEMPRE recalculados aqui — o amount vindo do navegador é ignorado.
//
// Padrão do pricing_lib.js: global var + IIFE, lido sob demanda ($app só é
// usado dentro das funções, nunca no boot).
// ---------------------------------------------------------------------------
var magazineLib = (function () {
  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100
  }

  // Id da edição do mês: a revista publicada mais recente (maior 'created').
  function edicaoDoMesId() {
    var recs = $app.findRecordsByFilter('magazines', '', '-created', 1, 0)
    return recs.length > 0 ? recs[0].id : ''
  }

  // Preços da landing page (registro semeado; mais recente por segurança).
  function precos() {
    var out = { current: 29.9, previous: 14.9 }
    try {
      var recs = $app.findRecordsByFilter('magazine_landing_page', '', '-created', 1, 0)
      if (recs.length > 0) {
        var cur = Number(recs[0].get('current_issue_price') || 0)
        var prev = Number(recs[0].get('previous_issue_price') || 0)
        if (cur > 0) out.current = cur
        if (prev > 0) out.previous = prev
      }
    } catch (err) {
      console.warn('[magazine_lib] usando preços padrão: ' + err.message)
    }
    return out
  }

  // Preço da edição pedida + se é a edição do mês. Se magazineId vazio ou
  // inexistente, assume a edição do mês. amount do navegador NUNCA entra aqui.
  function precoDaEdicao(magazineId) {
    var p = precos()
    var latestId = edicaoDoMesId()
    var isCurrent = !magazineId || magazineId === latestId
    var price = isCurrent ? p.current : p.previous
    if (!(price > 0)) price = isCurrent ? 29.9 : 14.9
    return { price: round2(price), isCurrent: isCurrent, latestId: latestId }
  }

  return {
    round2: round2,
    edicaoDoMesId: edicaoDoMesId,
    precos: precos,
    precoDaEdicao: precoDaEdicao,
  }
})()
