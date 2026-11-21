// ---------------------------------------------------------------------------
// TESTE (Mentorias — Parte 1, item 5): semente idempotente de dados de teste.
// Mentor "Teste Agenda (QA)", mentoria vinculada, agenda ter/qui 19:00-22:00,
// sessões de 60 min, 4 semanas à frente e uma data bloqueada (próxima quinta,
// 8 dias à frente — remove um dos dias esperados).
// Rodar a rota GET /backend/v1/mentorias/{id}/horarios com ?debug=1 deve
// devolver 19:00, 20:00 e 21:00 nas terças e quintas das próximas 4 semanas,
// menos a data bloqueada.
// Rodar de novo = no-op (busca por marcador antes de criar).
// ---------------------------------------------------------------------------
migrate(
  (app) => {
    var marcador = 'Teste Agenda (QA)'
    var mentorId = ''
    try {
      var existentes = app.findRecordsByFilter('mentors', 'name = "' + marcador + '"', '', 1, 0)
      if (existentes && existentes.length > 0) mentorId = existentes[0].id
    } catch (_) {}

    if (!mentorId) {
      var colM = app.findCollectionByNameOrId('mentors')
      var mentor = new Record(colM)
      mentor.set('name', marcador)
      mentor.set('topics', 'QA — teste de agenda')
      mentor.set('mini_cv', '<p>Mentor de teste (QA da agenda semanal).</p>')
      mentor.set('email', 'qa-agenda@educacaosst.com.br')
      mentor.set('meeting_link', 'https://meet.google.com/qa-teste-agenda')
      app.save(mentor)
      mentorId = mentor.id
    }

    var mentorshipId = ''
    try {
      var ms = app.findRecordsByFilter('mentorships', 'mentor = "' + mentorId + '"', '', 1, 0)
      if (ms && ms.length > 0) mentorshipId = ms[0].id
    } catch (_) {}

    if (!mentorshipId) {
      var colMs = app.findCollectionByNameOrId('mentorships')
      var mentoria = new Record(colMs)
      mentoria.set('title', 'Mentoria QA — Agenda Semanal')
      mentoria.set('mentor_name', marcador)
      mentoria.set('mentor', mentorId)
      mentoria.set('price', 249.9)
      mentoria.set('is_free', false)
      mentoria.set('session_minutes', 60)
      mentoria.set('min_notice_hours', 24)
      mentoria.set('weeks_ahead', 4)
      mentoria.set('max_slots_per_purchase', 4)
      app.save(mentoria)
      mentorshipId = mentoria.id
    }

    // agenda semanal: terça (2) e quinta (4), 19:00-22:00
    var temAgenda = false
    try {
      var av = app.findRecordsByFilter(
        'mentor_availability',
        'mentor = "' + mentorId + '"',
        '',
        1,
        0,
      )
      temAgenda = av && av.length > 0
    } catch (_) {}
    if (!temAgenda) {
      var colAv = app.findCollectionByNameOrId('mentor_availability')
      var wds = [2, 4]
      for (var i = 0; i < wds.length; i++) {
        var faixa = new Record(colAv)
        faixa.set('mentor', mentorId)
        faixa.set('weekday', wds[i])
        faixa.set('start_time', '19:00')
        faixa.set('end_time', '22:00')
        faixa.set('active', true)
        app.save(faixa)
      }
    }

    // uma data bloqueada: próxima quinta-feira +8 dias (fuso São Paulo)
    var jaBloqueada = false
    try {
      var bd = app.findRecordsByFilter(
        'mentor_blocked_dates',
        'mentor = "' + mentorId + '"',
        '',
        1,
        0,
      )
      jaBloqueada = bd && bd.length > 0
    } catch (_) {}
    if (!jaBloqueada) {
      var agoraSp = new Date(Date.now() + 3 * 3600 * 1000)
      var diasAteQuinta = (4 - agoraSp.getUTCDay() + 7) % 7
      if (diasAteQuinta === 0) diasAteQuinta = 7
      var alvo = new Date(agoraSp.getTime() + (diasAteQuinta + 7) * 86400000)
      var dataIso = alvo.toISOString().slice(0, 10)
      var colBl = app.findCollectionByNameOrId('mentor_blocked_dates')
      var bloqueio = new Record(colBl)
      bloqueio.set('mentor', mentorId)
      bloqueio.set('date', dataIso + ' 00:00:00')
      bloqueio.set('reason', 'Férias (teste QA)')
      app.save(bloqueio)
      console.log('[0144] data bloqueada de teste: ' + dataIso)
    }
  },
  (app) => {
    // rollback: remove os registros de teste criados
    try {
      var mentorsTeste = app.findRecordsByFilter('mentors', 'name = "Teste Agenda (QA)"', '', 10, 0)
      for (var i = 0; i < mentorsTeste.length; i++) {
        var mid = mentorsTeste[i].id
        try {
          var avs = app.findRecordsByFilter(
            'mentor_availability',
            'mentor = "' + mid + '"',
            '',
            50,
            0,
          )
          for (var a = 0; a < avs.length; a++) app.delete(avs[a])
        } catch (_) {}
        try {
          var bls = app.findRecordsByFilter(
            'mentor_blocked_dates',
            'mentor = "' + mid + '"',
            '',
            50,
            0,
          )
          for (var b = 0; b < bls.length; b++) app.delete(bls[b])
        } catch (_) {}
        try {
          var mss = app.findRecordsByFilter('mentorships', 'mentor = "' + mid + '"', '', 10, 0)
          for (var m = 0; m < mss.length; m++) app.delete(mss[m])
        } catch (_) {}
        app.delete(mentorsTeste[i])
      }
    } catch (_) {}
  },
)
