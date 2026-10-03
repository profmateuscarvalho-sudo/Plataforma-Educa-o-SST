// Dose do dia — auto-indexa questões novas e mantém o índice ativo.
onRecordAfterCreateSuccess((e) => {
  try {
    var col = $app.findCollectionByNameOrId('dose_perguntas')
    var qid = e.record.id
    var already = false
    try {
      $app.findFirstRecordByData('dose_perguntas', 'questao_id', qid)
      already = true
    } catch (_) {}
    if (!already) {
      var rec = new Record(col)
      rec.set('questao_id', qid)
      rec.set('ativa', true)
      $app.save(rec)
    }
  } catch (err) {
    $app.logger().error('dose_perguntas auto-index failed', 'error', err.message)
  }
  e.next()
}, 'simulado_questions')

// GET /backend/v1/dose/today
// Retorna a dose do dia: a pergunta já respondida hoje OU uma nova sorteada.
routerAdd('GET', '/backend/v1/dose/today', (e) => {
  if (!e.auth) return e.unauthorizedError('auth required')
  var userId = e.auth.id

  // Data de hoje no fuso de Brasília (America/Sao_Paulo, UTC-3).
  var now = new Date()
  var utc = now.getTime() + now.getTimezoneOffset() * 60000
  var brt = new Date(utc - 3 * 3600000)
  var today =
    brt.getUTCFullYear() +
    '-' +
    ('0' + (brt.getUTCMonth() + 1)).slice(-2) +
    '-' +
    ('0' + brt.getUTCDate()).slice(-2)

  // Já respondeu hoje?
  var todayAnswer = null
  try {
    todayAnswer = $app.findFirstRecordByFilter(
      'dose_respostas',
      'usuario_id = "' + userId + '" && data = "' + today + '"',
    )
  } catch (_) {}

  if (todayAnswer) {
    var pid = todayAnswer.get('pergunta_id')
    var dpRec = null
    try {
      dpRec = $app.findRecordById('dose_perguntas', pid)
    } catch (_) {}
    var qid = dpRec ? dpRec.get('questao_id') : ''
    return e.json(200, {
      answered: true,
      today: today,
      question_id: qid,
      acertou: todayAnswer.get('acertou'),
    })
  }

  // Perguntas ativas e ainda não vistas por este usuário.
  var activePerguntas = []
  try {
    activePerguntas = $app.findRecordsByFilter('dose_perguntas', 'ativa = true', 'created', 500, 0)
  } catch (_) {}

  if (activePerguntas.length === 0) {
    return e.json(200, { answered: false, today: today, question_id: '' })
  }

  // Histórico de quais questões este usuário já viu na dose.
  var seenIds = {}
  var seenList = []
  try {
    seenList = $app.findRecordsByFilter(
      'dose_respostas',
      'usuario_id = "' + userId + '"',
      'respondida_em',
      5000,
      0,
    )
  } catch (_) {}
  for (var si = 0; si < seenList.length; si++) {
    seenIds[seenList[si].get('pergunta_id')] = true
  }

  var unseen = []
  for (var i = 0; i < activePerguntas.length; i++) {
    if (!seenIds[activePerguntas[i].id]) unseen.push(activePerguntas[i])
  }

  var pool = unseen.length > 0 ? unseen : activePerguntas

  // Prioriza questões dos simulados em que o usuário teve pior desempenho.
  // Calcula a menor porcentagem por simulado entre as submissões do usuário.
  var worstSimulados = {}
  try {
    var subs = $app.findRecordsByFilter(
      'simulado_submissions',
      'user = "' + userId + '"',
      'created',
      500,
      0,
    )
    for (var bi = 0; bi < subs.length; bi++) {
      var simId = subs[bi].get('simulado')
      var pct = subs[bi].get('percentage') || 0
      if (!(simId in worstSimulados) || pct < worstSimulados[simId]) {
        worstSimulados[simId] = pct
      }
    }
  } catch (_) {}

  // Pega o simulado de pior desempenho e tenta achar questões dele no pool.
  var worstSimId = ''
  var worstPct = 999
  for (var ws in worstSimulados) {
    if (worstSimulados[ws] < worstPct) {
      worstPct = worstSimulados[ws]
      worstSimId = ws
    }
  }

  var chosen = null
  if (worstSimId) {
    var candidates = []
    for (var ci = 0; ci < pool.length; ci++) {
      var cqid = pool[ci].get('questao_id')
      var qRec = null
      try {
        qRec = $app.findRecordById('simulado_questions', cqid)
      } catch (_) {}
      if (qRec && qRec.get('simulado') === worstSimId) candidates.push(pool[ci])
    }
    if (candidates.length > 0) {
      // Entre as candidatas do pior simulado, libere as mais antigas primeiro.
      // Em Goja (runtime do PocketBase), record.get('created') retorna um
      // objeto Time, não string — .localeCompare() não existe nesse tipo.
      // Usamos comparação numérica via Date.getTime().
      candidates.sort(function (a, b) {
        return new Date(a.get('created')).getTime() - new Date(b.get('created')).getTime()
      })
      chosen = candidates[0]
    }
  }

  if (!chosen) {
    // Senão, sorteia entre o pool, priorizando as mais antigas.
    // Mesmo motivo: record.get('created') é um Time, não string.
    pool.sort(function (a, b) {
      return new Date(a.get('created')).getTime() - new Date(b.get('created')).getTime()
    })
    // Um pouco de aleatoriedade nos 40% mais antigos.
    var windowSize = Math.max(1, Math.ceil(pool.length * 0.4))
    var slice = pool.slice(0, windowSize)
    chosen = slice[Math.floor(Math.random() * slice.length)] || pool[0]
  }

  var chosenQid = chosen.get('questao_id')
  return e.json(200, {
    answered: false,
    today: today,
    question_id: chosenQid,
    pergunta_id: chosen.id,
  })
})

// POST /backend/v1/dose/answer
// Registra a resposta da dose: definitiva, uma por dia.
routerAdd('POST', '/backend/v1/dose/answer', (e) => {
  if (!e.auth) return e.unauthorizedError('auth required')
  var userId = e.auth.id
  var body = e.requestInfo().body || {}
  var perguntaId = body.pergunta_id || ''
  var questionId = body.question_id || ''
  var selected = body.selected || ''
  var correct = body.correct || ''

  if (!perguntaId && !questionId) {
    return e.badRequestError('pergunta_id or question_id is required')
  }

  // Data de hoje no fuso de Brasília (America/Sao_Paulo, UTC-3).
  var now = new Date()
  var utc = now.getTime() + now.getTimezoneOffset() * 60000
  var brt = new Date(utc - 3 * 3600000)
  var today =
    brt.getUTCFullYear() +
    '-' +
    ('0' + (brt.getUTCMonth() + 1)).slice(-2) +
    '-' +
    ('0' + brt.getUTCDate()).slice(-2)
  var nowIso = new Date().toISOString()

  // Já respondeu hoje?
  try {
    $app.findFirstRecordByFilter(
      'dose_respostas',
      'usuario_id = "' + userId + '" && data = "' + today + '"',
    )
    return e.json(409, { error: 'Você já respondeu a dose de hoje.' })
  } catch (_) {}

  // Resolve o registro de dose_perguntas.
  var dosePergunta = null
  if (perguntaId) {
    try {
      dosePergunta = $app.findRecordById('dose_perguntas', perguntaId)
    } catch (_) {}
  }
  if (!dosePergunta && questionId) {
    try {
      dosePergunta = $app.findFirstRecordByData('dose_perguntas', 'questao_id', questionId)
    } catch (_) {}
  }
  if (!dosePergunta) {
    return e.badRequestError('Pergunta não encontrada no índice da dose.')
  }

  var acertou = correct && selected === correct

  // Registra a resposta (treino, não entra na média dos simulados).
  var respCol = $app.findCollectionByNameOrId('dose_respostas')
  var resp = new Record(respCol)
  resp.set('usuario_id', userId)
  resp.set('pergunta_id', dosePergunta.id)
  resp.set('data', today)
  resp.set('acertou', !!acertou)
  resp.set('respondida_em', nowIso)
  $app.save(resp)

  // Atualiza a sequência.
  var seq = null
  try {
    seq = $app.findFirstRecordByFilter('sequencia_usuario', 'usuario_id = "' + userId + '"')
  } catch (_) {}
  if (!seq) {
    var seqCol = $app.findCollectionByNameOrId('sequencia_usuario')
    seq = new Record(seqCol)
    seq.set('usuario_id', userId)
    seq.set('sequencia_atual', 0)
    seq.set('recorde', 0)
    seq.set('ultima_data', '')
  }

  var ultimaData = seq.get('ultima_data') || ''
  var atual = seq.getInt('sequencia_atual') || 0
  var recorde = seq.getInt('recorde') || 0

  // Se ontem foi a última resposta, continua a sequência; senão reinicia em 1.
  var yest = new Date()
  yest.setUTCHours(0, 0, 0, 0)
  yest.setTime(yest.getTime() - 24 * 3600000)
  var yesterday =
    yest.getUTCFullYear() +
    '-' +
    ('0' + (yest.getUTCMonth() + 1)).slice(-2) +
    '-' +
    ('0' + yest.getUTCDate()).slice(-2)

  if (ultimaData === yesterday) {
    atual = atual + 1
  } else if (ultimaData === today) {
    // já contou hoje (não deveria chegar aqui, mas em segurança)
  } else {
    atual = 1
  }

  seq.set('sequencia_atual', atual)
  if (atual > recorde) {
    seq.set('recorde', atual)
  }
  seq.set('ultima_data', today)
  $app.save(seq)

  return e.json(200, {
    ok: true,
    acertou: !!acertou,
    sequencia_atual: atual,
    recorde: seq.getInt('recorde'),
    today: today,
  })
})

// GET /backend/v1/dose/sequencia
routerAdd('GET', '/backend/v1/dose/sequencia', (e) => {
  if (!e.auth) return e.unauthorizedError('auth required')
  var userId = e.auth.id
  var seq = null
  try {
    seq = $app.findFirstRecordByFilter('sequencia_usuario', 'usuario_id = "' + userId + '"')
  } catch (_) {}
  if (!seq) {
    return e.json(200, { sequencia_atual: 0, recorde: 0, ultima_data: '' })
  }
  return e.json(200, {
    sequencia_atual: seq.getInt('sequencia_atual') || 0,
    recorde: seq.getInt('recorde') || 0,
    ultima_data: seq.get('ultima_data') || '',
  })
})

// POST /backend/v1/push/subscribe
routerAdd('POST', '/backend/v1/push/subscribe', (e) => {
  if (!e.auth) return e.unauthorizedError('auth required')
  var userId = e.auth.id
  var body = e.requestInfo().body || {}
  var endpoint = body.endpoint || ''
  var p256dh = body.keys && body.keys.p256dh ? body.keys.p256dh : ''
  var auth = body.keys && body.keys.auth ? body.keys.auth : ''
  if (!endpoint) return e.badRequestError('endpoint is required')

  var col = $app.findCollectionByNameOrId('push_subscriptions')
  var existing = null
  try {
    existing = $app.findFirstRecordByData('push_subscriptions', 'endpoint', endpoint)
  } catch (_) {}
  if (existing) {
    existing.set('user', userId)
    if (p256dh) existing.set('p256dh', p256dh)
    if (auth) existing.set('auth', auth)
    $app.save(existing)
    return e.json(200, { ok: true })
  }
  var rec = new Record(col)
  rec.set('user', userId)
  rec.set('endpoint', endpoint)
  if (p256dh) rec.set('p256dh', p256dh)
  if (auth) rec.set('auth', auth)
  $app.save(rec)
  return e.json(200, { ok: true })
})

// DELETE /backend/v1/push/subscribe
routerAdd('DELETE', '/backend/v1/push/subscribe', (e) => {
  if (!e.auth) return e.unauthorizedError('auth required')
  var endpoint = e.requestInfo().body.endpoint || ''
  if (!endpoint) return e.badRequestError('endpoint is required')
  try {
    var rec = $app.findFirstRecordByData('push_subscriptions', 'endpoint', endpoint)
    $app.delete(rec)
  } catch (_) {}
  return e.json(200, { ok: true })
})

// Cron: lembrete diário. Roda a cada 30min e envia push só para quem pediu e
// ainda não respondeu a dose do dia, no horário configurado (padrão 19h).
cronAdd('dose_lembrete', '*/30 * * * *', () => {
  // Data de hoje no fuso de Brasília (America/Sao_Paulo, UTC-3).
  var now = new Date()
  var utc2 = now.getTime() + now.getTimezoneOffset() * 60000
  var brt2 = new Date(utc2 - 3 * 3600000)
  var today =
    brt2.getUTCFullYear() +
    '-' +
    ('0' + (brt2.getUTCMonth() + 1)).slice(-2) +
    '-' +
    ('0' + brt2.getUTCDate()).slice(-2)

  var users = []
  try {
    users = $app.findRecordsByFilter('users', 'role != "admin"', 'created', 5000, 0)
  } catch (_) {}

  for (var i = 0; i < users.length; i++) {
    var u = users[i]
    var ativo = u.get('lembrete_diario_ativo')
    if (!ativo) continue
    var hora = u.get('lembrete_diario_hora') || '19:00'

    var userId = u.id

    // Já respondeu hoje? Pula.
    try {
      $app.findFirstRecordByFilter(
        'dose_respostas',
        'usuario_id = "' + userId + '" && data = "' + today + '"',
      )
      continue
    } catch (_) {}

    var seq = null
    try {
      seq = $app.findFirstRecordByFilter('sequencia_usuario', 'usuario_id = "' + userId + '"')
    } catch (_) {}
    var dias = seq ? seq.getInt('sequencia_atual') || 0 : 0

    var subs = []
    try {
      subs = $app.findRecordsByFilter('push_subscriptions', 'user = "' + userId + '"', '', 50, 0)
    } catch (_) {}
    if (subs.length === 0) continue

    var msg = 'Sua dose de hoje está esperando — ' + dias + ' dias seguidos até agora.'

    // Tenta enviar push via VAPID (requer VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY).
    var vapidPrivate = $os.getenv('VAPID_PRIVATE_KEY')
    var vapidPublic = $os.getenv('VAPID_PUBLIC_KEY')
    var vapidSubject = $os.getenv('VAPID_SUBJECT') || 'mailto:no-reply@educacaosst.com'
    if (!vapidPrivate || !vapidPublic) continue

    var sendFn = null
    try {
      if (typeof $apis !== 'undefined' && typeof $apis.requestSubscription === 'function') {
        sendFn = $apis.requestSubscription
      }
    } catch (_) {}
    for (var si = 0; si < subs.length; si++) {
      if (!sendFn) break
      try {
        sendFn({
          subscription: {
            endpoint: subs[si].get('endpoint'),
            keys: {
              p256dh: subs[si].get('p256dh') || '',
              auth: subs[si].get('auth') || '',
            },
          },
          vapidPublicKey: vapidPublic,
          vapidPrivateKey: vapidPrivate,
          vapidSubject: vapidSubject,
          payload: JSON.stringify({
            title: 'Dose do dia',
            body: msg,
            data: { url: '/app' },
          }),
        })
      } catch (err) {
        $app.logger().warn('push send failed', 'error', err.message)
      }
    }
  }
})
