// ---------------------------------------------------------------------------
// BLOCO 3 — Controle de acesso por plano (servidor)
//
// Hooks onRecordGet/onRecordsList que REMOVEM conteúdo sensível das respostas
// públicas para quem não tem o acesso certo (matrix de acesso do Bloco 3):
//
//   lessons / modules       -> video_url e video_file só para quem pode abrir
//   materials               -> arquivo só para quem pode abrir
//   live_sessions           -> stream_url só para Prata/Ouro
//   doc_projects            -> video_url só para Prata/Ouro
//   magazines               -> fliphtml5_link / embed_code só para Prata/Ouro
//                              (compra avulsa de revista chega no Bloco 4)
//   mentorships             -> price é sempre o preço cheio; o desconto de 30%
//                              para Prata/Ouro é aplicado no servidor SOMENTE na
//                              cobrança (create_payment/ipag_payment)
//
// Regra do tier efetivo no servidor (espelho de use-student-access.ts):
//   admin  -> tudo
//   tier do usuário (plan_tier) OU tier da assinatura ativa, o maior deles,
//   desde que contract_end_date não tenha vencido (fuso de São Paulo).
//   Sem contrato definido, o tier do usuário vale. Vencido -> Free.
// ---------------------------------------------------------------------------

var ACCESS_TZ_OFFSET_MS = -3 * 60 * 60 * 1000 // UTC-3 (São Paulo), fixo

function agoraSpIso() {
  return new Date(Date.now() + ACCESS_TZ_OFFSET_MS).toISOString()
}

// 'YYYY-MM-DD' de hoje em São Paulo — comparação lexicográfica segura com
// datas gravadas nesse formato (contract_end_date).
function hojeSpDate() {
  return agoraSpIso().slice(0, 10)
}

function contractEndDate(userRec) {
  var raw = ''
  try {
    raw = String(userRec.getString('contract_end_date') || '')
  } catch (_) {
    raw = ''
  }
  return raw.trim()
}

// Contrato válido = vazio (sem restrição) ou data >= hoje (SP).
function contractAtivo(userRec) {
  var fim = contractEndDate(userRec)
  if (!fim) return true
  var hoje = hojeSpDate()
  return fim.slice(0, 10) >= hoje
}

function userTier(userRec) {
  if (!userRec) return 'free'
  try {
    if (String(userRec.getString('role') || '') === 'admin') return 'admin'
  } catch (_) {}
  var tier = ''
  try {
    tier = String(userRec.getString('plan_tier') || '').toLowerCase()
  } catch (_) {}
  return tier === 'prata' || tier === 'ouro' ? tier : 'free'
}

// Tier efetivo: maior entre users.plan_tier e a assinatura ativa (via plan),
// sempre condicionado ao contrato não vencido.
function tierEfetivo(userId) {
  if (!userId) return 'free'
  var userRec
  try {
    userRec = $app.findRecordById('users', userId)
  } catch (_) {
    return 'free'
  }
  if (userTier(userRec) === 'admin') return 'admin'

  var best = 0
  var t = userTier(userRec)
  if (contractAtivo(userRec)) {
    if (t === 'ouro') best = 3
    else if (t === 'prata') best = 2
  }

  // Assinaturas ativas: expande 'plan' para o tier do plano comprado.
  try {
    var subs = $app.findRecordsByFilter(
      'subscriptions',
      "user = '" + userId + "' && status = 'active'",
      '-created',
      20,
      0,
      { plan: null },
    )
    for (var i = 0; i < subs.length; i++) {
      var plan = subs[i].expand() ? subs[i].expand()['plan'] : null
      if (!plan) continue
      var nome = String(plan.getString('name') || '').toLowerCase()
      var preco = Number(plan.get('price') || 0)
      var tier = 0
      if (nome.indexOf('ouro') !== -1) tier = 3
      else if (nome.indexOf('prata') !== -1 || preco > 0) tier = 2
      if (tier > best) best = tier
    }
  } catch (_) {}

  if (best >= 3) return 'ouro'
  if (best === 2) return 'prata'
  return 'free'
}

function tierNivel(tier) {
  if (tier === 'admin') return 4
  if (tier === 'ouro') return 3
  if (tier === 'prata') return 2
  return 1
}

// Pode acessar conteúdo de assinatura (aula/live/revista/documentário)?
function temAcessoAssinatura(userId) {
  return tierNivel(tierEfetivo(userId)) >= 2
}

// Compra avulsa de curso: payment 'paid' com course_id apontando pro curso.
function comprouCurso(userId, courseId) {
  if (!userId || !courseId) return false
  try {
    var paid = $app.findRecordsByFilter(
      'payments',
      "user = '" +
        userId +
        "' && status = 'paid' && product_type = 'course' && course_id.id = '" +
        courseId +
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

// ---------------------------------------------------------------------------
// helpers de resposta
// ---------------------------------------------------------------------------

function sanitizeLesson(rec, hasFull) {
  if (hasFull) return
  try {
    if (rec.getString('video_url')) rec.set('video_url', '')
  } catch (_) {}
  try {
    if (rec.getString('panda_video_id')) rec.set('panda_video_id', '')
  } catch (_) {}
  try {
    rec.set('video_file', '')
  } catch (_) {}
}

function sanitizeModule(rec, hasFull) {
  if (hasFull) return
  try {
    if (rec.getString('video_url')) rec.set('video_url', '')
  } catch (_) {}
}

function sanitizeMaterial(rec, hasFull) {
  if (hasFull) return
  try {
    rec.set('file', '')
  } catch (_) {}
}

function sanitizeLive(rec, hasFull) {
  if (hasFull) return
  try {
    if (rec.getString('stream_url')) rec.set('stream_url', '')
  } catch (_) {}
}

function sanitizeDoc(rec, hasFull) {
  if (hasFull) return
  try {
    if (rec.getString('video_url')) rec.set('video_url', '')
  } catch (_) {}
}

function sanitizeMagazine(rec, hasFull) {
  if (hasFull) return
  try {
    if (rec.getString('fliphtml5_link')) rec.set('fliphtml5_link', '')
  } catch (_) {}
  try {
    if (rec.getString('embed_code')) rec.set('embed_code', '')
  } catch (_) {}
}

// Resolve o courseId de uma lesson (o campo pode se chamar 'course').
function lessonCourseId(rec) {
  try {
    var v = rec.getString('course') || rec.getString('course_id') || ''
    if (v) return v
  } catch (_) {}
  return ''
}

// ---------------------------------------------------------------------------
// LESSONS
// ---------------------------------------------------------------------------

onRecordGet((e) => {
  var rec = e.record
  if (!rec || rec.collection().name !== 'lessons') return e.next()
  var userId = e.auth ? e.auth.id : ''
  if (temAcessoAssinatura(userId) || userTier(e.auth) === 'admin') return e.next()
  var courseId = lessonCourseId(rec)
  var liberado = false
  try {
    var course = $app.findRecordById('courses', courseId)
    liberado = course.getBool('is_free')
  } catch (_) {}
  if (!liberado) liberado = comprouCurso(userId, courseId)
  if (!liberado) sanitizeLesson(rec, false)
  return e.next()
}, 'lessons')

onRecordsList((e) => {
  if (e.collection.name !== 'lessons') return e.next()
  var userId = e.auth ? e.auth.id : ''
  var isAdmin = userTier(e.auth) === 'admin'
  if (!isAdmin && temAcessoAssinatura(userId)) return e.next()
  var courseCache = {}
  for (var i = 0; i < e.records.length; i++) {
    var rec = e.records[i]
    var courseId = lessonCourseId(rec)
    var liberado = false
    if (courseCache[courseId] !== undefined) {
      liberado = courseCache[courseId]
    } else {
      try {
        var course = $app.findRecordById('courses', courseId)
        liberado = course.getBool('is_free')
      } catch (_) {
        liberado = false
      }
      courseCache[courseId] = liberado
    }
    if (!liberado) liberado = comprouCurso(userId, courseId)
    if (!liberado) sanitizeLesson(rec, false)
  }
  return e.next()
}, 'lessons')

// ---------------------------------------------------------------------------
// MODULES (podem carregar vídeo de apresentação)
// ---------------------------------------------------------------------------

onRecordGet((e) => {
  var rec = e.record
  if (!rec || rec.collection().name !== 'modules') return e.next()
  var userId = e.auth ? e.auth.id : ''
  if (temAcessoAssinatura(userId) || userTier(e.auth) === 'admin') return e.next()
  var courseId = ''
  try {
    courseId = rec.getString('course') || ''
  } catch (_) {}
  var liberado = false
  try {
    var course = $app.findRecordById('courses', courseId)
    liberado = course.getBool('is_free')
  } catch (_) {}
  if (!liberado) liberado = comprouCurso(userId, courseId)
  if (!liberado) sanitizeModule(rec, false)
  return e.next()
}, 'modules')

onRecordsList((e) => {
  if (e.collection.name !== 'modules') return e.next()
  var userId = e.auth ? e.auth.id : ''
  var isAdmin = userTier(e.auth) === 'admin'
  if (!isAdmin && temAcessoAssinatura(userId)) return e.next()
  var courseCache = {}
  for (var i = 0; i < e.records.length; i++) {
    var rec = e.records[i]
    var courseId = ''
    try {
      courseId = rec.getString('course') || ''
    } catch (_) {}
    var liberado = false
    if (courseCache[courseId] !== undefined) {
      liberado = courseCache[courseId]
    } else {
      try {
        var course = $app.findRecordById('courses', courseId)
        liberado = course.getBool('is_free')
      } catch (_) {
        liberado = false
      }
      courseCache[courseId] = liberado
    }
    if (!liberado) liberado = comprouCurso(userId, courseId)
    if (!liberado) sanitizeModule(rec, false)
  }
  return e.next()
}, 'modules')

// ---------------------------------------------------------------------------
// MATERIALS
// ---------------------------------------------------------------------------

onRecordGet((e) => {
  var rec = e.record
  if (!rec || rec.collection().name !== 'materials') return e.next()
  var userId = e.auth ? e.auth.id : ''
  if (temAcessoAssinatura(userId) || userTier(e.auth) === 'admin') return e.next()
  var courseId = ''
  try {
    courseId = rec.getString('course') || ''
  } catch (_) {}
  var liberado = false
  try {
    var course = $app.findRecordById('courses', courseId)
    liberado = course.getBool('is_free')
  } catch (_) {}
  if (!liberado) liberado = comprouCurso(userId, courseId)
  if (!liberado) sanitizeMaterial(rec, false)
  return e.next()
}, 'materials')

onRecordsList((e) => {
  if (e.collection.name !== 'materials') return e.next()
  var userId = e.auth ? e.auth.id : ''
  var isAdmin = userTier(e.auth) === 'admin'
  if (!isAdmin && temAcessoAssinatura(userId)) return e.next()
  var courseCache = {}
  for (var i = 0; i < e.records.length; i++) {
    var rec = e.records[i]
    var courseId = ''
    try {
      courseId = rec.getString('course') || ''
    } catch (_) {}
    var liberado = false
    if (courseCache[courseId] !== undefined) {
      liberado = courseCache[courseId]
    } else {
      try {
        var course = $app.findRecordById('courses', courseId)
        liberado = course.getBool('is_free')
      } catch (_) {
        liberado = false
      }
      courseCache[courseId] = liberado
    }
    if (!liberado) liberado = comprouCurso(userId, courseId)
    if (!liberado) sanitizeMaterial(rec, false)
  }
  return e.next()
}, 'materials')

// ---------------------------------------------------------------------------
// LIVE_SESSIONS
// ---------------------------------------------------------------------------

onRecordGet((e) => {
  var rec = e.record
  if (!rec || rec.collection().name !== 'live_sessions') return e.next()
  var userId = e.auth ? e.auth.id : ''
  if (!temAcessoAssinatura(userId) && userTier(e.auth) !== 'admin') sanitizeLive(rec, false)
  return e.next()
}, 'live_sessions')

onRecordsList((e) => {
  if (e.collection.name !== 'live_sessions') return e.next()
  var userId = e.auth ? e.auth.id : ''
  var aberto = temAcessoAssinatura(userId) || userTier(e.auth) === 'admin'
  if (!aberto) {
    for (var i = 0; i < e.records.length; i++) sanitizeLive(e.records[i], false)
  }
  return e.next()
}, 'live_sessions')

// ---------------------------------------------------------------------------
// DOC_PROJECTS (documentários)
// ---------------------------------------------------------------------------

onRecordGet((e) => {
  var rec = e.record
  if (!rec || rec.collection().name !== 'doc_projects') return e.next()
  var userId = e.auth ? e.auth.id : ''
  var tier = tierEfetivo(userId)
  if (tierNivel(tier) >= 2 || tier === 'admin') return e.next()
  var isFree = false
  try {
    isFree = rec.getBool('is_free')
  } catch (_) {}
  if (!isFree) sanitizeDoc(rec, false)
  return e.next()
}, 'doc_projects')

onRecordsList((e) => {
  if (e.collection.name !== 'doc_projects') return e.next()
  var userId = e.auth ? e.auth.id : ''
  var tier = tierEfetivo(userId)
  var liberado = tierNivel(tier) >= 2 || tier === 'admin'
  if (!liberado) {
    for (var i = 0; i < e.records.length; i++) {
      var rec = e.records[i]
      var isFree = false
      try {
        isFree = rec.getBool('is_free')
      } catch (_) {}
      if (!isFree) sanitizeDoc(rec, false)
    }
  }
  return e.next()
}, 'doc_projects')

// ---------------------------------------------------------------------------
// MAGAZINES (link de leitura)
// ---------------------------------------------------------------------------

onRecordGet((e) => {
  var rec = e.record
  if (!rec || rec.collection().name !== 'magazines') return e.next()
  var userId = e.auth ? e.auth.id : ''
  if (!temAcessoAssinatura(userId) && userTier(e.auth) !== 'admin') sanitizeMagazine(rec, false)
  return e.next()
}, 'magazines')

onRecordsList((e) => {
  if (e.collection.name !== 'magazines') return e.next()
  var userId = e.auth ? e.auth.id : ''
  var aberto = temAcessoAssinatura(userId) || userTier(e.auth) === 'admin'
  if (!aberto) {
    for (var i = 0; i < e.records.length; i++) sanitizeMagazine(e.records[i], false)
  }
  return e.next()
}, 'magazines')
