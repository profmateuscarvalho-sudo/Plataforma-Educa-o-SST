// ---------------------------------------------------------------------------
// ⚠️ HOOK DE DEBUG — TEMPORÁRIO — ARQUIVO INTEIRO APAGADO APÓS VALIDAÇÃO ⚠️
//
// onBootstrap: (1) recria 8 slots de teste (status 'livre') para a mentoria QA
// em 3 datas (2026-12-03 ×3, 2026-12-10 ×2, 2026-12-17 ×3); (2) chama a rota
// REAL GET /backend/v1/mentorias/{id}/horarios?mes=2026-12&debug_bypass=1
// via $http.send no host público interno da própria instância e grava a
// resposta em email_logs ('debug-horarios@educacaosst.com.br') para leitura
// via db_query; (3) apaga TODOS os slots de teste da mentoria QA.
//
// JSVM: lógica 100% inline no callback (sem declarações top-level).
// ---------------------------------------------------------------------------

onBootstrap((e) => {
  e.next()

  var mid = 'dyzbvq5lv1at9id'
  var base = 'https://educacao-sst-premium-969c2.shrd03-1.internal.goskip.dev'

  // limpa linhas de debug anteriores
  try {
    var antigas = $app.findRecordsByFilter(
      'email_logs',
      "recipient_email = 'debug-horarios@educacaosst.com.br'",
      '-created',
      20,
      0,
    )
    for (var a = 0; a < antigas.length; a++) $app.delete(antigas[a])
  } catch (_) {}

  // 0) recria os slots de teste (8, em 3 datas)
  var datas = {
    '2026-12-03': ['19:00', '20:00', '21:00'],
    '2026-12-10': ['14:00', '15:00'],
    '2026-12-17': ['09:00', '10:00', '11:00'],
  }
  var sessionMinutes = 60
  var mentorId = 'cmvuqpsms4mcufv'
  var criadosTotais = 0
  try {
    var mentoria = $app.findRecordById('mentorships', mid)
    var sm = Number(mentoria.get('session_minutes') || 0)
    if (sm >= 15) sessionMinutes = Math.floor(sm)
  } catch (_) {}
  var col = null
  try {
    col = $app.findCollectionByNameOrId('mentorship_slots')
  } catch (_) {}
  if (col) {
    for (var dia in datas) {
      var hs = datas[dia]
      var dp = dia.split('-')
      for (var h = 0; h < hs.length; h++) {
        var pp = String(hs[h]).split(':')
        var startMs =
          Date.UTC(
            Number(dp[0]),
            Number(dp[1]) - 1,
            Number(dp[2]),
            Number(pp[0]),
            Number(pp[1] || 0),
            0,
          ) -
          3 * 3600 * 1000
        var rec = new Record(col)
        rec.set('mentorship', mid)
        rec.set('mentor', mentorId)
        rec.set('start_at', new Date(startMs).toISOString())
        rec.set('end_at', new Date(startMs + sessionMinutes * 60 * 1000).toISOString())
        rec.set('status', 'livre')
        try {
          $app.save(rec)
          criadosTotais++
        } catch (_) {}
      }
    }
  }

  // 1) chama a rota REAL de horários (host público interno, egress OK)
  try {
    var res = $http.send({
      url: base + '/backend/v1/mentorias/' + mid + '/horarios?mes=2026-12&debug_bypass=1',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    })
    var rec2 = new Record($app.findCollectionByNameOrId('email_logs'))
    rec2.set('recipient_email', 'debug-horarios@educacaosst.com.br')
    rec2.set('recipient_name', 'HORARIOS status=' + String(res.status))
    rec2.set('error_message', String(res.raw).slice(0, 1900))
    rec2.set('email_type', 'lead')
    rec2.set('sent', false)
    $app.save(rec2)
  } catch (err) {
    try {
      var recE = new Record($app.findCollectionByNameOrId('email_logs'))
      recE.set('recipient_email', 'debug-horarios@educacaosst.com.br')
      recE.set('recipient_name', 'HORARIOS ERRO')
      recE.set('error_message', String(err).slice(0, 1900))
      recE.set('email_type', 'lead')
      recE.set('sent', false)
      $app.save(recE)
    } catch (_) {}
  }

  // 2) apaga TODOS os slots de teste da mentoria QA (deixa o banco limpo)
  try {
    var todos = $app.findRecordsByFilter(
      'mentorship_slots',
      "mentorship = '" + mid + "'",
      '',
      1000,
      0,
    )
    var n = todos.length
    for (var i = 0; i < todos.length; i++) $app.delete(todos[i])
    var rec3 = new Record($app.findCollectionByNameOrId('email_logs'))
    rec3.set('recipient_email', 'debug-horarios@educacaosst.com.br')
    rec3.set('recipient_name', 'CLEANUP criados=' + criadosTotais + ' apagados=' + String(n))
    rec3.set('email_type', 'lead')
    rec3.set('sent', false)
    $app.save(rec3)
  } catch (err2) {
    try {
      var recC2 = new Record($app.findCollectionByNameOrId('email_logs'))
      recC2.set('recipient_email', 'debug-horarios@educacaosst.com.br')
      recC2.set('recipient_name', 'CLEANUP ERRO')
      recC2.set('error_message', String(err2).slice(0, 1900))
      recC2.set('email_type', 'lead')
      recC2.set('sent', false)
      $app.save(recC2)
    } catch (_) {}
  }
})
