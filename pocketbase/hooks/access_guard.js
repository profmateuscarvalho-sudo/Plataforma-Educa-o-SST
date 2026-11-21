// ---------------------------------------------------------------------------
// access_guard.js — controle de acesso por plano (camadas escondidas).
//
// Otimização de desempenho (mesmas regras de acesso de antes):
// - Todo processamento vive no onRecordEnrich, que cobre lista, view e expand
//   — cada registro é processado UMA vez (antes havia também um loop duplicado
//   no onRecordsListRequest, removido).
// - Contexto de acesso por usuário em $app.store(), chave access:<userId>,
//   TTL 60s: nível via assinatura active + ids de cursos/revistas com
//   pagamento 'paid'. No máximo 3 consultas por usuário/60s, não por registro.
// - Mapas módulo->curso e curso->is_free em $app.store() por 5 minutos.
// - Caminhos rápidos sem consulta: admin/superuser libera tudo; visitante
//   anônimo cai no nível 1 sem consultar nada.
//
// Regras preservadas (BLOCOS 1-4):
//   1. lessons/live_sessions->panda_video_id, materials->file,
//      doc_projects->panda+youtube_url, magazines->fliphtml5_link+embed_code.
//   2. Admin vê tudo (role OU superuser).
//   3. Prata/Ouro com contrato vigente (ou assinatura active Prata/Ouro) lê.
//   4. magazines: quem pagou ESTA edição também lê; doc_projects: is_free lê.
//
// IMPORTANTE (limitação da JSVM desta plataforma): callbacks executam em pool
// separado — todo helper é declarado DENTRO do corpo do callback. O estado em
// cache vive em $app.store(), que persiste entre chamadas (não em variáveis).
// ---------------------------------------------------------------------------

onRecordEnrich((e) => {
  // --- helpers (inline — JSVM: nada de top-level referenciado no callback) ---

  // Hoje em SP (UTC-3), como string YYYY-MM-DD.
  function hojeSpDate() {
    return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
  }

  // Preenche store() só se a chave não existir/estiver vencida — $app.store()
  // não tem TTL, o vencimento é guardado junto do valor.
  function getWithLoad(key, ttlMs, loadFn) {
    var st = null
    try {
      st = $app.store()
    } catch (_) {
      return loadFn()
    }
    var now = Date.now()
    try {
      var hit = st.get(key)
      if (hit && hit.exp && hit.exp > now) return hit.v
      if (hit) st.remove(key)
    } catch (_) {}
    var v = loadFn()
    try {
      st.set(key, { exp: now + ttlMs, v: v })
    } catch (_) {}
    return v
  }

  var MODULES_LIMIT = 2000
  var COURSES_LIMIT = 2000

  // Mapa módulo -> curso (cache 5 min; dados que quase não mudam).
  function loadModulesMap() {
    var map = {}
    try {
      var mods = $app.findRecordsByFilter('modules', '', '', MODULES_LIMIT, 0)
      for (var i = 0; i < mods.length; i++) {
        var m = mods[i]
        var mid = ''
        try {
          mid = String(m.getString('id') || '')
        } catch (_) {}
        var cid = ''
        try {
          cid = String(m.getString('course') || '')
        } catch (_) {}
        if (mid) map[mid] = cid
      }
    } catch (_) {}
    return map
  }

  // Mapa curso -> is_free (cache 5 min).
  function loadCoursesMap() {
    var map = {}
    try {
      var cs = $app.findRecordsByFilter('courses', '', '', COURSES_LIMIT, 0)
      for (var i2 = 0; i2 < cs.length; i2++) {
        var c = cs[i2]
        var cId = ''
        try {
          cId = String(c.getString('id') || '')
        } catch (_) {}
        var isFree = false
        try {
          isFree = c.getBool('is_free')
        } catch (_) {}
        if (cId) map[cId] = isFree
      }
    } catch (_) {}
    return map
  }

  // Contexto completo do usuário: tier (das assinaturas) + ids de cursos e
  // revistas compradas. No máximo 3 consultas (payments, subscriptions e os
  // planos dessas assinaturas), tudo guardado por 60s. O resto do tier
  // (plan_tier/contract_end_date) vem do registro de auth no próprio request,
  // sem consulta.
  function loadAccess(uid) {
    var out = { paidCourses: {}, paidMagazines: {}, subsBest: 1 }
    try {
      var pgs = $app.findRecordsByFilter(
        'payments',
        "user = '" + uid + "' && status = 'paid'",
        '-created',
        500,
        0,
      )
      for (var i = 0; i < pgs.length; i++) {
        var p = pgs[i]
        var tipo = ''
        try {
          tipo = String(p.getString('product_type') || '')
        } catch (_) {}
        if (tipo === 'course') {
          var cid = ''
          try {
            cid = String(p.getString('course_id') || '')
          } catch (_) {}
          if (cid) out.paidCourses[cid] = 1
        } else if (tipo === 'magazine') {
          var mid = ''
          try {
            mid = String(p.getString('magazine_id') || '')
          } catch (_) {}
          if (mid) out.paidMagazines[mid] = 1
        }
      }
    } catch (_) {}
    // Tier via assinatura active (mesma regra de antes: plano Prata/Ouro).
    try {
      var subs = $app.findRecordsByFilter(
        'subscriptions',
        "user = '" + uid + "' && status = 'active'",
        '-created',
        20,
        0,
      )
      for (var j = 0; j < subs.length; j++) {
        var pid = ''
        try {
          pid = subs[j].getString('plan')
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
        if (nome.indexOf('ouro') !== -1) out.subsBest = Math.max(out.subsBest, 3)
        else if (nome.indexOf('prata') !== -1) out.subsBest = Math.max(out.subsBest, 2)
      }
    } catch (_) {}
    return out
  }

  // --- início do processamento do registro ---

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

  var auth = null
  try {
    auth = e.requestInfo ? e.requestInfo.auth : null
  } catch (_) {}

  var uid = ''
  try {
    uid = auth ? String(auth.getString('id') || '') : ''
  } catch (_) {}

  // Admin (ou superuser acima): libera tudo, sem consultar nada.
  var role = ''
  try {
    role = String(auth.getString('role') || '')
  } catch (_) {}
  if (role === 'admin') return e.next()

  var nivel = 1
  if (auth) {
    // Mesma regra de antes: plan_tier + contrato vigente (do registro de auth,
    // sem consulta) ou assinatura active com plano Prata/Ouro (do cache).
    var t = ''
    try {
      t = String(auth.getString('plan_tier') || '').toLowerCase()
    } catch (_) {}
    var fim = ''
    try {
      fim = String(auth.getString('contract_end_date') || '').trim()
    } catch (_) {}
    var contratoOk = !fim || fim.slice(0, 10) >= hojeSpDate()
    if (contratoOk) {
      if (t === 'ouro') nivel = 3
      else if (t === 'prata') nivel = 2
    }
    try {
      var ctxNivel = getWithLoad('access:' + uid, 60 * 1000, function () {
        return loadAccess(uid)
      })
      nivel = Math.max(nivel, ctxNivel ? ctxNivel.subsBest : 1)
    } catch (_) {}
  }

  function esconde(r, campo) {
    try {
      r.hide(campo)
    } catch (_) {}
  }
  function liberarCurso(courseId, ctx) {
    // courses.is_free -> compra 'paid' -> não liberado (mesma ordem de antes)
    var isFree = false
    try {
      var cm = getWithLoad('access_guard:courses_map', 5 * 60 * 1000, loadCoursesMap)
      if (courseId && cm[courseId] !== undefined) isFree = cm[courseId] === true
    } catch (_) {}
    if (isFree) return true
    if (!courseId) return false
    return ctx && ctx.paidCourses[courseId] === 1
  }
  function aplicaProtecao(r, c, nv, ctx) {
    if (c === 'lessons' || c === 'modules' || c === 'materials') {
      if (nv >= 2) return
      var courseId = ''
      try {
        if (c === 'modules') {
          courseId = String(r.getString('course') || '')
        } else {
          var mid2 = String(r.getString('module') || '')
          if (mid2) {
            var mm = getWithLoad('access_guard:modules_map', 5 * 60 * 1000, loadModulesMap)
            courseId = String(mm[mid2] || '')
            if (!courseId) {
              // cache sem esse módulo (criado nos últimos 5 min): resolve direto
              try {
                var mod = $app.findRecordById('modules', mid2)
                courseId = String(mod.getString('course') || '')
              } catch (_) {
                courseId = ''
              }
            }
          }
        }
      } catch (_) {
        courseId = ''
      }
      var liberado = liberarCurso(courseId, ctx)
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
      if (nv < 2) esconde(r, 'panda_video_id')
      return
    }
    if (c === 'doc_projects') {
      if (nv < 2) {
        var isFreeRec = false
        try {
          isFreeRec = r.getBool('is_free')
        } catch (_) {}
        if (!isFreeRec) {
          esconde(r, 'panda_video_id')
          esconde(r, 'youtube_url')
        }
      }
      return
    }
    if (c === 'magazines') {
      // BLOCO 4 — além de Prata/Ouro/admin, libera quem pagou ESTA edição
      var rId = ''
      try {
        rId = String(r.getString('id') || '')
      } catch (_) {}
      var revistaLiberada = nv >= 2 || (ctx && ctx.paidMagazines[rId] === 1)
      if (!revistaLiberada) {
        esconde(r, 'fliphtml5_link')
        esconde(r, 'embed_code')
      }
      return
    }
  }

  // Contexto de acesso: 1 carregamento por usuário (cache 60s), compartilhado
  // por todos os registros do request (lista, view e expand).
  var ctx = null
  try {
    ctx = uid
      ? getWithLoad('access:' + uid, 60 * 1000, function () {
          return loadAccess(uid)
        })
      : { paidCourses: {}, paidMagazines: {} }
  } catch (_) {
    ctx = { paidCourses: {}, paidMagazines: {} }
  }

  aplicaProtecao(rec, col, nivel, ctx)
  return e.next()
})
