// ---------------------------------------------------------------------------
// ROTA PROTEGIDA DE LEITURA DA REVISTA — GET /backend/v1/magazine-read-link
//
// A guarda do access_guard (v0.0.350) esconde fliphtml5_link/embed_code da
// LISTAGEM de magazines para quem não tem direito. Os leitores (MagazineReader,
// Dialog em Revistas, Home) NÃO podem decidir "conteúdo indisponível" pelos
// campos da listagem — buscam o link por ESTA rota, que aplica a MESMA regra:
//   - tier efetivo prata/ouro ATIVO (plan_tier + contract_end_date >= hoje SP;
//     vencida = Free; assinatura active com plano Prata/Ouro também conta)
//   - admin/superuser
//   - pagamento 'paid' com product_type='magazine' e aquele magazine_id
//   - magazine.is_free = true (amostra gratuita)
// Resposta 200: { access: true,  link, embed_code, embed_src, is_free }
// Resposta 403: { access: false }
//
// IMPORTANTE (limitação da JSVM desta plataforma): callbacks executam em pool
// separado — NÃO referencie declarações top-level dentro deles. Tudo inline.
// ---------------------------------------------------------------------------
routerAdd('GET', '/backend/v1/magazine-read-link', (e) => {
  var q = {}
  try {
    q = e.requestInfo().query || {}
  } catch (_) {}
  var magazineId = String(q.magazine || q.id || '').trim()

  if (!magazineId) {
    return e.json(400, { access: false, error: 'Parâmetro magazine (id) é obrigatório' })
  }

  var mag = null
  try {
    mag = $app.findRecordById('magazines', magazineId)
  } catch (_) {
    return e.json(404, { access: false, error: 'Revista não encontrada' })
  }

  var isFree = false
  try {
    isFree = mag.getBool('is_free')
  } catch (_) {}

  var link = String(mag.get('fliphtml5_link') || '')
  var embedCode = String(mag.get('embed_code') || '')

  function resposta() {
    var embedSrc = ''
    if (!link && embedCode) {
      var m = embedCode.match(/src=["']([^"']+)["']/i)
      if (m && m[1]) embedSrc = m[1]
    }
    return {
      access: true,
      link: link,
      embed_code: embedCode,
      embed_src: embedSrc,
      is_free: isFree,
      magazine_id: magazineId,
    }
  }

  // superuser/admin: liberado
  try {
    if (e.auth && String(e.auth.getString('role') || '') === 'admin') return e.json(200, resposta())
  } catch (_) {}
  try {
    if (e.hasSuperuserAuth && e.hasSuperuserAuth()) return e.json(200, resposta())
  } catch (_) {}

  if (isFree) return e.json(200, resposta())

  var uid = ''
  try {
    uid = String(e.auth ? e.auth.id : '')
  } catch (_) {}

  // tier efetivo: plan_tier + contract_end_date (>= hoje SP; vazio conta como
  // válido, igual ao access_guard) — fallback: assinatura active com plano
  // Prata/Ouro
  if (uid) {
    var nivel = 1
    try {
      var t = String(e.auth.getString('plan_tier') || '').toLowerCase()
      var fim = String(e.auth.getString('contract_end_date') || '').trim()
      var hoje = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
      var contratoOk = !fim || fim.slice(0, 10) >= hoje
      if (contratoOk) {
        if (t === 'ouro') nivel = 3
        else if (t === 'prata') nivel = 2
      }
    } catch (_) {}
    if (nivel < 2) {
      try {
        var subs = $app.findRecordsByFilter(
          'subscriptions',
          "user = '" + uid + "' && status = 'active'",
          '-created',
          20,
          0,
        )
        for (var i = 0; i < subs.length; i++) {
          var pid = ''
          try {
            pid = subs[i].getString('plan')
          } catch (_) {}
          if (!pid) continue
          var plano = null
          try {
            plano = $app.findRecordById('subscription_plans', pid)
          } catch (_) {
            continue
          }
          var nome = ''
          try {
            nome = String(plano.getString('name') || '').toLowerCase()
          } catch (_) {}
          if (nome.indexOf('ouro') !== -1) nivel = Math.max(nivel, 3)
          else if (nome.indexOf('prata') !== -1) nivel = Math.max(nivel, 2)
        }
      } catch (_) {}
    }
    if (nivel >= 2) return e.json(200, resposta())

    // compra avulsa: pagamento 'paid' desta edição
    try {
      var paid = $app.findRecordsByFilter(
        'payments',
        "user = '" +
          uid +
          "' && status = 'paid' && product_type = 'magazine' && magazine_id = '" +
          magazineId +
          "'",
        '-created',
        1,
        0,
      )
      if (paid.length > 0) return e.json(200, resposta())
    } catch (_) {}
  }

  return e.json(403, { access: false })
})
