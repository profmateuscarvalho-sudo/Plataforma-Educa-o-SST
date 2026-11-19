// ---------------------------------------------------------------------------
// BLOCO 3 — Controle de acesso por plano (servidor)
//
// onRecordEnrich + onRecordsListRequest: ESCONDEM o conteúdo sensível da
// resposta (record.hide — só afeta a serialização, não o banco) para quem
// não tem acesso:
//
//   lessons             -> panda_video_id (campo REAL; não existe video_url)
//   modules             -> nada a esconder hoje (sem campos de mídia no schema)
//   materials           -> file (resolve o curso via module -> modules.course)
//   live_sessions       -> panda_video_id (não existe stream_url/video_url)
//   doc_projects        -> panda_video_id + youtube_url (is_free libera todos)
//   magazines           -> fliphtml5_link + embed_code (catálogo fica público;
//                          compra avulsa de edição: Bloco 4)
//
// Regra de entitulamento (idêntica em todos os casos): curso liberado se
// courses.is_free = true; ou tier efetivo prata/ouro ATIVO (plan_tier +
// contract_end_date >= hoje SP; vencida = Free; assinatura active com plano
// Prata/Ouro também conta); ou pagamento 'paid' com course_id (compra avulsa);
// ou admin/superuser.
//
// IMPORTANTE (limitação da JSVM desta plataforma): callbacks executam em pool
// separado — NÃO referencie funções/const top-level dentro deles. TODA a
// lógica vive INLINE no corpo de cada callback (duplicada entre os dois).
// ---------------------------------------------------------------------------

onRecordEnrich((e) => {
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

  // superuser: nunca esconder (evita quebrar o painel)
  try {
    if (e.requestInfo && e.requestInfo.hasSuperuserAuth && e.requestInfo.hasSuperuserAuth()) {
      return e.next()
    }
  } catch (_) {}

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
  function esconde(r, campo) {
    try {
      r.hide(campo)
    } catch (_) {}
  }
  // lessons/materials: curso via module -> modules.course; modules: course direto
  function cursoDoItem(r, c) {
    try {
      if (c === 'modules') return String(r.getString('course') || '')
      var mid = String(r.getString('module') || '')
      if (!mid) return ''
      var mod = $app.findRecordById('modules', mid)
      return String(mod.getString('course') || '')
    } catch (_) {
      return ''
    }
  }
  function aplicaProtecao(r, c, nivel, uid) {
    if (c === 'lessons' || c === 'modules' || c === 'materials') {
      if (nivel >= 2) return
      var courseId = cursoDoItem(r, c)
      var liberado = false
      try {
        var curso = $app.findRecordById('courses', courseId)
        liberado = curso.getBool('is_free')
      } catch (_) {
        liberado = false
      }
      if (!liberado) liberado = comprouCurso(uid, courseId)
      if (!liberado) {
        if (c === 'lessons') {
          esconde(r, 'panda_video_id')
        } else if (c === 'materials') {
          esconde(r, 'file')
        }
        // modules: sem campos de mídia no schema atual — nada a esconder
      }
      return
    }
    if (c === 'live_sessions') {
      if (nivel < 2) esconde(r, 'panda_video_id')
      return
    }
    if (c === 'doc_projects') {
      if (nivel < 2) {
        var isFree = false
        try {
          isFree = r.getBool('is_free')
        } catch (_) {}
        if (!isFree) {
          esconde(r, 'panda_video_id')
          esconde(r, 'youtube_url')
        }
      }
      return
    }
    if (c === 'magazines') {
      if (nivel < 2) {
        esconde(r, 'fliphtml5_link')
        esconde(r, 'embed_code')
      }
      return
    }
  }

  var auth = null
  try {
    auth = e.requestInfo ? e.requestInfo.auth : null
  } catch (_) {}
  var nivel = 1
  if (auth) {
    try {
      nivel = nivelEfetivo(auth)
    } catch (_) {
      nivel = 1
    }
  }
  var uid = ''
  try {
    uid = auth ? auth.id : ''
  } catch (_) {}
  aplicaProtecao(rec, col, nivel, uid)
  return e.next()
})

onRecordsListRequest((e) => {
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

  try {
    if (e.requestInfo && e.requestInfo.hasSuperuserAuth && e.requestInfo.hasSuperuserAuth()) {
      return e.next()
    }
  } catch (_) {}

  // --- helpers inline (duplicados do hook acima: JSVM exige inline) ---
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
  function esconde(r, campo) {
    try {
      r.hide(campo)
    } catch (_) {}
  }
  function cursoDoItem(r, c) {
    try {
      if (c === 'modules') return String(r.getString('course') || '')
      var mid = String(r.getString('module') || '')
      if (!mid) return ''
      var mod = $app.findRecordById('modules', mid)
      return String(mod.getString('course') || '')
    } catch (_) {
      return ''
    }
  }

  var auth = null
  try {
    auth = e.requestInfo ? e.requestInfo.auth : null
  } catch (_) {}
  var nivel = 1
  if (auth) {
    try {
      nivel = nivelEfetivo(auth)
    } catch (_) {
      nivel = 1
    }
  }
  var uid = ''
  try {
    uid = auth ? auth.id : ''
  } catch (_) {}
  var courseCache = {}
  var liberadoCache = {}

  for (var i = 0; i < e.records.length; i++) {
    var rec = e.records[i]
    var c = col
    if (c === 'lessons' || c === 'modules' || c === 'materials') {
      if (nivel >= 2) continue
      var courseId = cursoDoItem(rec, c)
      var liberado = liberadoCache[courseId]
      if (liberado === undefined) {
        liberado = false
        try {
          var curso = $app.findRecordById('courses', courseId)
          liberado = curso.getBool('is_free')
        } catch (_) {
          liberado = false
        }
        if (!liberado && courseId) {
          courseCache[courseId] = 1
          liberado = comprouCurso(uid, courseId)
        }
        liberadoCache[courseId] = liberado
      }
      if (!liberado) {
        if (c === 'lessons') {
          esconde(rec, 'panda_video_id')
        } else if (c === 'materials') {
          esconde(rec, 'file')
        }
      }
    } else if (c === 'live_sessions') {
      if (nivel < 2) esconde(rec, 'panda_video_id')
    } else if (c === 'doc_projects') {
      if (nivel < 2) {
        var isFree = false
        try {
          isFree = rec.getBool('is_free')
        } catch (_) {}
        if (!isFree) {
          esconde(rec, 'panda_video_id')
          esconde(rec, 'youtube_url')
        }
      }
    } else if (c === 'magazines') {
      if (nivel < 2) {
        esconde(rec, 'fliphtml5_link')
        esconde(rec, 'embed_code')
      }
    }
  }
  return e.next()
})
