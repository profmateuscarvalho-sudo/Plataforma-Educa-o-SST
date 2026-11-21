// ---------------------------------------------------------------------------
// MENTORIAS — ROTA PROTEGIDA DE HORÁRIOS LIVRES
// GET /backend/v1/mentorias/{id}/horarios  (também aceita ?mentorship=ID)
//
// Exige aluno/admin autenticado (o aluno usa na Parte 2 para escolher horário).
// Gera os horários LIVRES a partir da agenda semanal do mentor daquela
// mentoria (mentor_availability), para as próximas weeks_ahead semanas no fuso
// de São Paulo (UTC-3 fixo), fatiando cada faixa em sessões de session_minutes.
// Remove: passado/antecedência mínima (min_notice_hours), datas bloqueadas
// (mentor_blocked_dates), slots ocupados por bookings 'confirmado' e por
// 'reservado' ainda não expirados (expires_at no futuro).
// Resposta 200: { mentorship_id, session_minutes, weeks_ahead,
//                 days: [{ date: "2025-01-15", slots: ["19:00","20:00"] }] }
// Resposta 401: { error: "Autenticação necessária" }
//
// IMPORTANTE (limitação da JSVM desta plataforma): callbacks executam em pool
// separado — NÃO referencie declarações top-level dentro deles. Tudo inline.
// ---------------------------------------------------------------------------
routerAdd(
  'GET',
  '/backend/v1/mentorias/{id}/horarios',
  (e) => {
    var q = {}
    try {
      q = e.requestInfo().query || {}
    } catch (_) {}
    var mentorshipId = ''
    try {
      mentorshipId = String(e.request.pathValue('id') || '').trim()
    } catch (_) {}
    if (!mentorshipId) mentorshipId = String(q.mentorship || q.id || '').trim()

    var uid = ''
    var isAdmin = false
    try {
      if (e.auth) {
        uid = String(e.auth.id || '')
        isAdmin = String(e.auth.getString('role') || '') === 'admin'
      }
    } catch (_) {}
    try {
      if (e.hasSuperuserAuth && e.hasSuperuserAuth()) isAdmin = true
    } catch (_) {}

    if (!uid && !isAdmin) {
      return e.json(401, { error: 'Autenticação necessária' })
    }
    if (!mentorshipId) {
      return e.json(400, { error: 'Id da mentoria é obrigatório' })
    }

    var mentoria = null
    try {
      mentoria = $app.findRecordById('mentorships', mentorshipId)
    } catch (_) {
      return e.json(404, { error: 'Mentoria não encontrada' })
    }

    var mentorId = ''
    try {
      mentorId = String(mentoria.getString('mentor') || '').trim()
    } catch (_) {}
    if (!mentorId) {
      return e.json(200, { mentorship_id: mentorshipId, days: [] })
    }

    var sessionMinutes = 60
    var noticeHours = 24
    var weeksAhead = 4
    try {
      var sm = Number(mentoria.get('session_minutes'))
      if (sm >= 15) sessionMinutes = Math.floor(sm)
    } catch (_) {}
    try {
      var nh = Number(mentoria.get('min_notice_hours'))
      if (nh >= 0) noticeHours = Math.floor(nh)
    } catch (_) {}
    try {
      var wa = Number(mentoria.get('weeks_ahead'))
      if (wa >= 1) weeksAhead = Math.floor(wa)
    } catch (_) {}

    // agora: fuso São Paulo = UTC-3 fixo (sem horário de verão)
    var nowRealMs = Date.now()
    var sp = new Date(nowRealMs + 3 * 3600 * 1000) // relógio de SP deslocado
    var todaySp = sp.toISOString().slice(0, 10)
    var minStartRealMs = nowRealMs + noticeHours * 3600 * 1000

    // agenda semanal ativa do mentor
    var faixas = []
    try {
      var av = $app.findRecordsByFilter(
        'mentor_availability',
        "mentor = '" + mentorId + "' && active = true",
        'weekday',
        200,
        0,
      )
      for (var i = 0; i < av.length; i++) {
        faixas.push({
          weekday: Number(av[i].get('weekday')),
          start: String(av[i].get('start_time') || ''),
          end: String(av[i].get('end_time') || ''),
        })
      }
    } catch (err) {
      console.log('[horarios] erro mentor_availability: ' + err)
    }

    // datas bloqueadas (slice(0,10) normaliza o ISO guardado pelo PocketBase)
    var bloqueadas = {}
    try {
      var bl = $app.findRecordsByFilter(
        'mentor_blocked_dates',
        "mentor = '" + mentorId + "'",
        '',
        500,
        0,
      )
      for (var b = 0; b < bl.length; b++) {
        var bd = String(bl[b].get('date') || '').slice(0, 10)
        if (bd) bloqueadas[bd] = true
      }
    } catch (err) {
      console.log('[horarios] erro mentor_blocked_dates: ' + err)
    }

    // slots ocupados: 'confirmado' + 'reservado' ainda não expirado
    var nowIso = new Date(nowRealMs).toISOString()
    var ocupados = [] // { startMs, endMs }
    try {
      var bk = $app.findRecordsByFilter(
        'mentorship_bookings',
        "mentor = '" +
          mentorId +
          "' && (status = 'confirmado' || (status = 'reservado' && expires_at > '" +
          nowIso +
          "'))",
        '',
        500,
        0,
      )
      for (var k = 0; k < bk.length; k++) {
        var stMs = Date.parse(String(bk[k].get('start_at') || ''))
        var enMs = Date.parse(String(bk[k].get('end_at') || ''))
        if (isNaN(stMs) || isNaN(enMs)) continue
        ocupados.push({ startMs: stMs, endMs: enMs })
      }
    } catch (err) {
      console.log('[horarios] erro mentorship_bookings: ' + err)
    }

    var dois = function (n) {
      return (n < 10 ? '0' : '') + n
    }

    // percorre os dias das próximas weeks_ahead semanas (a partir de hoje em SP)
    var baseMs = Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), sp.getUTCDate(), 12, 0, 0)
    var grupos = {}
    var ordem = []
    var vistos = {}

    for (var d = 0; d < weeksAhead * 7; d++) {
      var diaMs = baseMs + d * 86400000
      var dia = new Date(diaMs).toISOString().slice(0, 10)
      var wd = new Date(diaMs).getUTCDay()
      if (bloqueadas[dia]) continue

      var partes = dia.split('-')
      var yy = Number(partes[0])
      var mm = Number(partes[1]) - 1
      var dd = Number(partes[2])

      for (var f = 0; f < faixas.length; f++) {
        var faixa = faixas[f]
        if (faixa.weekday !== wd) continue
        var hm1 = faixa.start.split(':')
        var hm2 = faixa.end.split(':')
        if (hm1.length < 2 || hm2.length < 2) continue
        var hIni = Number(hm1[0])
        var mIni = Number(hm1[1])
        var fimMs = Date.UTC(yy, mm, dd, Number(hm2[0]), Number(hm2[1])) // relógio SP como UTC
        var slotMs = Date.UTC(yy, mm, dd, hIni, mIni)
        while (slotMs + sessionMinutes * 60000 <= fimMs) {
          var realStartMs = slotMs - 3 * 3600 * 1000 // converte relógio SP → UTC real
          if (realStartMs >= minStartRealMs && !vistos[dia + ' ' + slotMs]) {
            var livre = true
            for (var o = 0; o < ocupados.length; o++) {
              if (
                realStartMs < ocupados[o].endMs &&
                realStartMs + sessionMinutes * 60000 > ocupados[o].startMs
              ) {
                livre = false
                break
              }
            }
            if (livre) {
              vistos[dia + ' ' + slotMs] = true
              var hora =
                dois(new Date(slotMs).getUTCHours()) + ':' + dois(new Date(slotMs).getUTCMinutes())
              if (!grupos[dia]) {
                grupos[dia] = []
                ordem.push(dia)
              }
              grupos[dia].push(hora)
            }
          }
          slotMs += sessionMinutes * 60000
        }
      }
    }

    ordem.sort()
    var days = []
    for (var g = 0; g < ordem.length; g++) {
      var diaG = ordem[g]
      var slots = grupos[diaG]
      slots.sort()
      days.push({ date: diaG, slots: slots })
    }

    var resp = {
      mentorship_id: mentorshipId,
      mentor_id: mentorId,
      session_minutes: sessionMinutes,
      min_notice_hours: noticeHours,
      weeks_ahead: weeksAhead,
      today: todaySp,
      days: days,
    }
    try {
      if (String(q.debug || '') === '1') {
        console.log('[horarios] debug ' + mentorshipId + ': ' + JSON.stringify(resp))
      }
    } catch (_) {}

    return e.json(200, resp)
  },
  $apis.requireAuth(),
)
