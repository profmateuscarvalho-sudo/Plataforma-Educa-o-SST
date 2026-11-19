// ---------------------------------------------------------------------------
// ROTA PROTEGIDA DE VÍDEO — GET /backend/v1/video-link?type=lesson|live|documentary&id=...
//
// Mesmo desenho da rota da revista (magazine_read_link.js): a guarda do
// access_guard (v0.0.350) esconde os campos de vídeo da LISTAGEM para quem não
// tem direito — e nenhum campo vem preenchido em tempo real. Nenhuma tela
// decide o player pelos campos do registro: busca o link por ESTA rota, que
// aplica a MESMA matriz do Bloco 3 do access_guard:
//   - lesson      -> curso liberado? (courses.is_free, compra 'paid' do curso,
//                    tier prata/ouro ativo, admin)
//   - live        -> exige tier prata/ouro ATIVO (ou admin)
//   - documentary -> doc_projects.is_free libera todos; senão prata/ouro/admin
// Resposta 200: { access: true,  video_id, url }   (url = embed pronto)
// Resposta 403: { access: false }
//
// IMPORTANTE (limitação da JSVM desta plataforma): callbacks executam em pool
// separado — NÃO referencie declarações top-level dentro deles. Tudo inline.
// ---------------------------------------------------------------------------
routerAdd('GET', '/backend/v1/video-link', (e) => {
  var q = {}
  try {
    q = e.requestInfo().query || {}
  } catch (_) {}
  var type = String(q.type || '').trim().toLowerCase()
  var id = String(q.id || '').trim()

  if (!id || ['lesson', 'live', 'documentary'].indexOf(type) === -1) {
    return e.json(400, { access: false, error: 'Parâmetros type (lesson|live|documentary) e id são obrigatórios' })
  }

  var colecao = type === 'live' ? 'live_sessions' : type === 'documentary' ? 'doc_projects' : 'lessons'
  var rec = null
  try {
    rec = $app.findRecordById(colecao, id)
  } catch (_) {
    return e.json(404, { access: false, error: 'Registro não encontrado' })
  }

  var videoId = ''
  try {
    videoId = String(rec.get('panda_video_id') || '')
  } catch (_) {}
  var youtubeUrl = ''
  if (type === 'documentary') {
    try {
      youtubeUrl = String(rec.get('youtube_url') || '')
    } catch (_) {}
  }

  function resposta() {
    var url = ''
    var v = videoId
    if (v) {
      if (v.indexOf('<iframe') !== -1 || v.indexOf('src="') !== -1) {
        var m = v.match(/src=["']([^"']+)["']/i)
        url = m && m[1] ? m[1] : ''
      } else if (v.indexOf('http') === 0) {
        url = v
      } else {
        url = 'https://player-vz-c2b2b8c9-251.tv.pandavideo.com.br/embed/?v=' + v
      }
    }
    if (!url && youtubeUrl) {
      var ym = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
      url = ym && ym[1] ? 'https://www.youtube.com/embed/' + ym[1] : youtubeUrl
    }
    return {
      access: true,
      video_id: videoId,
      url: url,
      youtube_url: youtubeUrl,
    }
  }

  // --- helpers inline (JSVM: nada de top-level) ---
  function hojeSpDate() {
    return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
  }
  function nivelEfetivo(authRec) {
    var role = ''
    try {
      role = String(authRec.getString('role') || '')
    } catch (_) {}
    if (role === 'admin') return 4
    var uid = ''
    try {
      uid = String(authRec.getString('id') || '')
    } catch (_) {}
    if (!uid) return 1
    var best = 1
    var t = ''
    try {
      t = String(authRec.getString('plan_tier') || '').toLowerCase()
    } catch (_) {}
    var fim = ''
    try {
      fim = String(authRec.getString('contract_end_date') || '').trim()
    } catch (_) {}
    var contratoOk = !fim || fim.slice(0, 10) >= hojeSpDate()
    if (contratoOk) {
      if (t === 'ouro') best = 3
      else if (t === 'prata') best = 2
    }
    if (best < 2) {
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
          if (nome.indexOf('ouro') !== -1) best = Math.max(best, 3)
          else if (nome.indexOf('prata') !== -1) best = Math.max(best, 2)
        }
      } catch (_) {}
    }
    return best
  }
  function comprouCurso(uid, cid) {
    if (!uid || !cid) return false
    try {
      var paid = $app.findRecordsByFilter(
        'payments',
        "user = '" + uid + "' && status = 'paid' && product_type = 'course' && course_id = '" + cid + "'",
        '-created',
        1,
        0,
      )
      return paid.length > 0
    } catch (_) {
      return false
    }
  }

  // superuser/admin: liberado
  var liberado = false
  try {
    if (e.auth && String(e.auth.getString('role') || '') === 'admin') liberado = true
  } catch (_) {}
  try {
    if (!liberado && e.hasSuperuserAuth && e.hasSuperuserAuth()) liberado = true
  } catch (_) {}

  var uid = ''
  try {
    uid = String(e.auth ? e.auth.id : '')
  } catch (_) {}

  // BLOCO 3 — lesson: mesma regra do access_guard para lessons
  if (!liberado && type === 'lesson' && uid) {
    var courseId = ''
    try {
      var mid = String(rec.getString('module') || '')
      if (mid) {
        var mod = $app.findRecordById('modules', mid)
        courseId = String(mod.getString('course') || '')
      }
    } catch (_) {}
    try {
      var curso = $app.findRecordById('courses', courseId)
      if (curso.getBool('is_free')) liberado = true
    } catch (_) {}
    if (!liberado && courseId) liberado = comprouCurso(uid, courseId)
    if (!liberado && nivelEfetivo(e.auth) >= 2) liberado = true
  }

  // BLOCO 3 — live: exige prata/ouro ativo
  if (!liberado && type === 'live' && uid) {
    if (nivelEfetivo(e.auth) >= 2) liberado = true
  }

  // BLOCO 3 — documentary: is_free libera todos; senão prata/ouro
  if (!liberado && type === 'documentary') {
    var isFree = false
    try {
      isFree = rec.getBool('is_free')
    } catch (_) {}
    if (isFree) liberado = true
    else if (uid && nivelEfetivo(e.auth) >= 2) liberado = true
  }

  if (!liberado) return e.json(403, { access: false })

  var out = resposta()
  // Registro sem vídeo cadastrado: ainda 200 com access:true, mas url vazia —
  // a tela mostra "vídeo não disponível" (não é caso de bloqueio de plano).
  return e.json(200, out)
})
