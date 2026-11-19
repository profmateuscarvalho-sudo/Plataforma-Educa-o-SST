// ---------------------------------------------------------------------------
// BLOCO 3 — Controle de acesso por plano (servidor)
//
// Dois hooks globais (onRecordGet + onRecordsList) que REMOVEM o conteúdo
// sensível das respostas para quem não tem acesso (matriz do Bloco 3):
//
//   lessons / modules / materials -> vídeo/arquivo só p/ curso is_free, ou
//                                    compra avulsa (payments paid), ou Prata/Ouro
//   live_sessions                 -> panda_video_id só Prata/Ouro
//   doc_projects                  -> panda_video_id/youtube_url só Prata/Ouro
//                                    (is_free liberado a todos autenticados)
//   magazines                     -> fliphtml5_link/embed_code só Prata/Ouro
//                                    (compra avulsa de revista: Bloco 4)
//
// IMPORTANTE (limitação da JSVM desta plataforma): callbacks executam em pool
// separado — NÃO referencie declarações top-level dentro deles. Toda função
// aqui é declarada DENTRO do corpo do callback (duplicada entre os dois hooks).
//
// Campos reais do schema: live_sessions e lessons usam panda_video_id (não
// stream_url/video_url); doc_projects usa panda_video_id + youtube_url;
// materials/lessons apontam para o curso via module -> modules.course.
// ---------------------------------------------------------------------------

onRecordGet((e) => {
  var rec = e.record
  if (!rec) return e.next()
  var col = ''
  try {
    col = rec.collection().name
  } catch (_) {
    return e.next()
  }
  var PROTEGIDAS = {
    lessons: 1,
    modules: 1,
    materials: 1,
    live_sessions: 1,
    doc_projects: 1,
    magazines: 1,
  }
  if (!PROTEGIDAS[col]) return e.next()

  // --- helpers inline (JSVM: nada de top-level) ---
  function hojeSpDate() {
    return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
  }
  function contractAtivo(u) {
    var fim = ''
    try {
      fim = String(u.getString('contract_end_date') || '').trim()
    } catch (_) {}
    if (!fim) return true
    return fim.slice(0, 10) >= hojeSpDate()
  }
  function nivelEfetivo(userId, authRec) {
    var role = ''
    try {
      role = String(authRec.getString('role') || '')
    } catch (_) {}
    if (role === 'admin') return 4
    if (!userId) return 1
    var best = 1
    var t = ''
    try {
      t = String(authRec.getString('plan_tier') || '').toLowerCase()
    } catch (_) {}
    var ok = contractAtivo(authRec)
    if (t === 'ouro' && ok) best = 3
    else if (t === 'prata' && ok) best = 2
    try {
      var subs = $app.findRecordsByFilter(
        'subscriptions',
        "user = '" + userId + "' && status = 'active'",
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
        var preco = 0
        try {
          nome = String(plano.getString('name') || '').toLowerCase()
        } catch (_) {}
        try {
          preco = Number(plano.get('price') || 0)
        } catch (_) {}
        if (nome.indexOf('ouro') !== -1) best = Math.max(best, 3)
        else if (nome.indexOf('prata') !== -1 || preco > 0) best = Math.max(best, 2)
      }
    } catch (_) {}
    return best
  }
  function comprouCurso(uid, cid) {
    if (!uid || !cid) return false
    try {
      var paid = $app.findRecordsByFilter(
        'payments',
        "user = '" +
          uid +
          "' && status = 'paid' && product_type = 'course' && course_id = '" +
          cid +
          "'",
        '-created',
        1,
        0,
      )
      return paid.length > 0
    } catch (_) {
      return false
    }
  }
  function limpa(r, campo) {
    try {
      r.set(campo, '')
    } catch (_) {}
  }
  function limpaSePresente(r, campo) {
    var v = ''
    try {
      v = String(r.getString(campo) || '')
    } catch (_) {
      v = ''
    }
    if (v) limpa(r, campo)
  }
  // lessons/materials: curso via module -> modules.course; modules: course direto
  function cursoDoItem(r) {
    try {
      if (col === 'modules') return String(r.getString('course') || '')
      var mid = String(r.getString('module') || '')
      if (!mid) return ''
      var mod = $app.findRecordById('modules', mid)
      return String(mod.getString('course') || '')
    } catch (_) {
      return ''
    }
  }

  var userId = e.auth ? e.auth.id : ''
  var nivel = nivelEfetivo(userId, e.auth)

  if (col === 'lessons' || col === 'modules' || col === 'materials') {
    if (nivel >= 2) return e.next()
    var courseId = cursoDoItem(rec)
    var liberado = false
    try {
      var c = $app.findRecordById('courses', courseId)
      liberado = c.getBool('is_free')
    } catch (_) {}
    if (!liberado) liberado = comprouCurso(userId, courseId)
    if (!liberado) {
      if (col === 'lessons') {
        limpaSePresente(rec, 'panda_video_id') // vídeo da aula vem daqui
        try {
          rec.set('video_file', '')
        } catch (_) {}
        try {
          rec.set('video_url', '')
        } catch (_) {}
      } else if (col === 'materials') {
        limpa(rec, 'file')
      } else {
        limpaSePresente(rec, 'video_url')
        limpaSePresente(rec, 'panda_video_id')
      }
    }
    return e.next()
  }

  if (col === 'live_sessions') {
    if (nivel < 2) limpaSePresente(rec, 'panda_video_id')
    return e.next()
  }

  if (col === 'doc_projects') {
    if (nivel < 2) {
      var isFree = false
      try {
        isFree = rec.getBool('is_free')
      } catch (_) {}
      if (!isFree) {
        limpaSePresente(rec, 'panda_video_id')
        limpaSePresente(rec, 'youtube_url')
      }
    }
    return e.next()
  }

  if (col === 'magazines') {
    if (nivel < 2) {
      limpaSePresente(rec, 'fliphtml5_link')
      limpaSePresente(rec, 'embed_code')
    }
    return e.next()
  }

  return e.next()
})

onRecordsList((e) => {
  var col = ''
  try {
    col = e.collection.name
  } catch (_) {
    return e.next()
  }
  var PROTEGIDAS = {
    lessons: 1,
    modules: 1,
    materials: 1,
    live_sessions: 1,
    doc_projects: 1,
    magazines: 1,
  }
  if (!PROTEGIDAS[col]) return e.next()

  // --- helpers inline (duplicados do hook acima: JSVM exige inline) ---
  function hojeSpDate() {
    return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
  }
  function contractAtivo(u) {
    var fim = ''
    try {
      fim = String(u.getString('contract_end_date') || '').trim()
    } catch (_) {}
    if (!fim) return true
    return fim.slice(0, 10) >= hojeSpDate()
  }
  function nivelEfetivo(userId, authRec) {
    var role = ''
    try {
      role = String(authRec.getString('role') || '')
    } catch (_) {}
    if (role === 'admin') return 4
    if (!userId) return 1
    var best = 1
    var t = ''
    try {
      t = String(authRec.getString('plan_tier') || '').toLowerCase()
    } catch (_) {}
    var ok = contractAtivo(authRec)
    if (t === 'ouro' && ok) best = 3
    else if (t === 'prata' && ok) best = 2
    try {
      var subs = $app.findRecordsByFilter(
        'subscriptions',
        "user = '" + userId + "' && status = 'active'",
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
        var preco = 0
        try {
          nome = String(plano.getString('name') || '').toLowerCase()
        } catch (_) {}
        try {
          preco = Number(plano.get('price') || 0)
        } catch (_) {}
        if (nome.indexOf('ouro') !== -1) best = Math.max(best, 3)
        else if (nome.indexOf('prata') !== -1 || preco > 0) best = Math.max(best, 2)
      }
    } catch (_) {}
    return best
  }
  function comprouCurso(uid, cid) {
    if (!uid || !cid) return false
    try {
      var paid = $app.findRecordsByFilter(
        'payments',
        "user = '" +
          uid +
          "' && status = 'paid' && product_type = 'course' && course_id = '" +
          cid +
          "'",
        '-created',
        1,
        0,
      )
      return paid.length > 0
    } catch (_) {
      return false
    }
  }
  function limpa(r, campo) {
    try {
      r.set(campo, '')
    } catch (_) {}
  }
  function limpaSePresente(r, campo) {
    var v = ''
    try {
      v = String(r.getString(campo) || '')
    } catch (_) {
      v = ''
    }
    if (v) limpa(r, campo)
  }
  function cursoDoItem(r) {
    try {
      if (col === 'modules') return String(r.getString('course') || '')
      var mid = String(r.getString('module') || '')
      if (!mid) return ''
      var mod = $app.findRecordById('modules', mid)
      return String(mod.getString('course') || '')
    } catch (_) {
      return ''
    }
  }

  var userId = e.auth ? e.auth.id : ''
  var nivel = nivelEfetivo(userId, e.auth)
  var courseCache = {}

  for (var i = 0; i < e.records.length; i++) {
    var rec = e.records[i]
    if (col === 'lessons' || col === 'modules' || col === 'materials') {
      if (nivel >= 2) continue
      var courseId = cursoDoItem(rec)
      var liberado = false
      if (courseCache[courseId] !== undefined) {
        liberado = courseCache[courseId]
      } else {
        try {
          var c = $app.findRecordById('courses', courseId)
          liberado = c.getBool('is_free')
        } catch (_) {
          liberado = false
        }
        courseCache[courseId] = liberado
      }
      if (!liberado) liberado = comprouCurso(userId, courseId)
      if (!liberado) {
        if (col === 'lessons') {
          limpaSePresente(rec, 'panda_video_id')
          try {
            rec.set('video_file', '')
          } catch (_) {}
          try {
            rec.set('video_url', '')
          } catch (_) {}
        } else if (col === 'materials') {
          limpa(rec, 'file')
        } else {
          limpaSePresente(rec, 'video_url')
          limpaSePresente(rec, 'panda_video_id')
        }
      }
    } else if (col === 'live_sessions') {
      if (nivel < 2) limpaSePresente(rec, 'panda_video_id')
    } else if (col === 'doc_projects') {
      if (nivel < 2) {
        var isFree = false
        try {
          isFree = rec.getBool('is_free')
        } catch (_) {}
        if (!isFree) {
          limpaSePresente(rec, 'panda_video_id')
          limpaSePresente(rec, 'youtube_url')
        }
      }
    } else if (col === 'magazines') {
      if (nivel < 2) {
        limpaSePresente(rec, 'fliphtml5_link')
        limpaSePresente(rec, 'embed_code')
      }
    }
  }
  return e.next()
})
