// GET /backend/v1/magazine-pricing — endpoint PÚBLICO e leve que expõe apenas
// os dois preços de magazine_landing_page (edição do mês e anteriores), a mesma
// regra do backend (magazine_lib.precoDaEdicao). Serve para o card da revista e
// o leitor bloqueado exibirem "Comprar esta edição — R$ 29,90".
//
// IMPORTANTE (limitação da JSVM desta plataforma): callbacks executam em pool
// separado — NÃO referencie declarações top-level dentro deles. Tudo inline.
routerAdd('GET', '/backend/v1/magazine-pricing', (e) => {
  var out = { current: 29.9, previous: 14.9, latest_magazine_id: '' }
  try {
    var recs = $app.findRecordsByFilter('magazine_landing_page', '', '-created', 1, 0)
    if (recs.length > 0) {
      var cur = Number(recs[0].get('current_issue_price') || 0)
      var prev = Number(recs[0].get('previous_issue_price') || 0)
      if (cur > 0) out.current = cur
      if (prev > 0) out.previous = prev
    }
  } catch (err) {
    // Preços padrão já setados acima; endpoint nunca falha por falta de registro
    console.warn('[magazine-pricing] fallback: ' + err.message)
  }
  try {
    var mags = $app.findRecordsByFilter('magazines', '', '-created', 1, 0)
    if (mags.length > 0) out.latest_magazine_id = mags[0].id
  } catch (_) {}
  return e.json(200, out)
})
