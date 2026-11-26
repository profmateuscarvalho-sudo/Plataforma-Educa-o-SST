// GET /backend/v1/magazine-pricing — endpoint PÚBLICO e leve que expõe apenas
// os dados de magazine_landing_page usados pela Home e pelos cards de revista:
//   - current/previous: preços da venda avulsa (edição do mês / anteriores)
//   - latest_magazine_id: id da edição publicada mais recente
//   - home_video / home_video_poster: arquivos do hero (nomes de arquivo; a URL
//     completa é montada no cliente com pb.files.getUrl)
//   - current_issue_pages: nº de páginas da edição do mês
// A regra "edição do mês = revista publicada mais recente" é a mesma do backend
// (magazine_lib.precoDaEdicao). IMPORTANTE (limitação da JSVM desta plataforma):
// callbacks executam em pool separado — NÃO referencie declarações top-level
// dentro deles. Tudo inline.
routerAdd('GET', '/backend/v1/magazine-pricing', (e) => {
  var out = {
    current: 29.9,
    previous: 14.9,
    latest_magazine_id: '',
    home_video: '',
    home_video_poster: '',
    current_issue_pages: 0,
    media_record_id: '',
  }
  try {
    var recs = $app.findRecordsByFilter('magazine_landing_page', '', '-created', 1, 0)
    if (recs.length > 0) {
      var cur = Number(recs[0].get('current_issue_price') || 0)
      var prev = Number(recs[0].get('previous_issue_price') || 0)
      if (cur > 0) out.current = cur
      if (prev > 0) out.previous = prev
      var video = String(recs[0].get('home_video') || '')
      var poster = String(recs[0].get('home_video_poster') || '')
      var pages = Number(recs[0].get('current_issue_pages') || 0)
      if (video) out.home_video = video
      if (poster) out.home_video_poster = poster
      if (pages > 0) out.current_issue_pages = pages
      out.media_record_id = recs[0].id
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
