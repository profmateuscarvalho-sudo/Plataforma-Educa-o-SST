// ---------------------------------------------------------------------------
// MENTORIAS — ROTA DE HORÁRIOS LIVRES (novo modelo: mentorship_slots)
// GET /backend/v1/mentorias/{id}/horarios?mes=AAAA-MM
//
// Devolve, para o mês pedido (default: mês atual de São Paulo), os DIAS com
// horários LIVRES, ignorando horários no passado e com menos de 24h de
// antecedência. Slot com booking 'reservado' cujo expires_at já passou volta a
// ser livre. Fuso de São Paulo (UTC-3 fixo, sem horário de verão). Formato:
//   { mentorship_id, session_minutes, mes, total, days: [
//       { date: "2025-12-03", slots: ["19:00","20:00","21:00"] }] }
//
// Requer autenticação (aluno, admin ou superuser — o aluno usa na Parte 2).
//
// CONVENÇÃO JSVM: toda a lógica fica INLINE dentro do callback — declarações
// top-level no mesmo arquivo causam "Hook scoping error"; sem imports.
// ---------------------------------------------------------------------------

routerAdd(
  'GET',
  '/backend/v1/mentorias/{id}/horarios',
  (e) => {
    var mentorshipId = ''
    var mes = ''
    try {
      var q = e.requestInfo().query || {}
      mentorshipId = String(e.request.pathValue('id') || '').trim()
      mes = String(q.mes || '').trim()
    } catch (_) {}

    // valida mês AAAA-MM (default: mês atual de São Paulo)
    if (!/^\d{4}-\d{2}$/.test(mes)) {
      try {
        mes = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 7)
      } catch (_) {
        mes = ''
      }
    }
    if (!mes) return e.json(400, { error: 'Mês inválido' })

    var mentoria = null
    try {
      mentoria = $app.findRecordById('mentorships', mentorshipId)
    } catch (_) {
      return e.json(404, { error: 'Mentoria não encontrada' })
    }
    if (!mentoria) return e.json(404, { error: 'Mentoria não encontrada' })

    var sessionMinutes = 60
    try {
      var sm = Number(mentoria.get('session_minutes') || 0)
      if (sm >= 15) sessionMinutes = Math.floor(sm)
    } catch (_) {}

    var mentorId = ''
    try {
      mentorId = String(mentoria.getString('mentor') || '').trim()
    } catch (_) {}

    // Janela do mês no fuso SP (relógio SP tratado como UTC, -3h para o real)
    var mesAno = mes.split('-')
    var anoMes = Number(mesAno[0])
    var numMes = Number(mesAno[1])
    if (!(numMes >= 1 && numMes <= 12)) {
      return e.json(400, { error: 'Mês inválido' })
    }
    var inicioMesIso = new Date(
      Date.UTC(anoMes, numMes - 1, 1, 0, 0, 0) - 3 * 3600 * 1000,
    ).toISOString()
    var fimMesIso = new Date(
      Date.UTC(anoMes, numMes, 0, 23, 59, 59) - 3 * 3600 * 1000,
    ).toISOString()
    var agoraMs = Date.now()
    var corteAntecedenciaMs = agoraMs + 24 * 3600 * 1000 // 24h de antecedência

    var faixaFiltro =
      "mentorship = '" +
      mentorshipId +
      "' && start_at >= '" +
      inicioMesIso +
      "' && start_at <= '" +
      fimMesIso +
      "'"

    // 1) slots LIVRES do mês
    var slotsLivre = []
    try {
      slotsLivre = $app.findRecordsByFilter(
        'mentorship_slots',
        faixaFiltro + " && status = 'livre'",
        'start_at',
        1000,
        0,
      )
    } catch (errS) {
      console.log('[horarios] erro mentorship_slots (livre): ' + errS)
    }

    // 2) slots 'reservado' cuja reserva EXPIROU voltam a ser livres
    var reservados = []
    try {
      reservados = $app.findRecordsByFilter(
        'mentorship_slots',
        faixaFiltro + " && status = 'reservado'",
        'start_at',
        1000,
        0,
      )
    } catch (errR) {
      console.log('[horarios] erro mentorship_slots (reservado): ' + errR)
    }
    for (var r = 0; r < reservados.length; r++) {
      var expirou = false
      try {
        var bookingId = String(reservados[r].get('booking') || '')
        if (!bookingId) {
          expirou = true // reserva órfã (sem booking) → liberada
        } else {
          var booking = $app.findRecordById('mentorship_bookings', bookingId)
          var expStr = String(booking.get('expires_at') || '')
          var expMs = expStr ? Date.parse(expStr) : NaN
          if (isNaN(expMs) || expMs <= agoraMs) expirou = true
        }
      } catch (_) {
        expirou = true // booking sumiu → reserva morta
      }
      if (expirou) slotsLivre.push(reservados[r])
    }

    // 3) agrupa por dia (relógio SP), cortando passado e < 24h de antecedência
    var grupos = {}
    var ordem = []
    var total = 0
    for (var i = 0; i < slotsLivre.length; i++) {
      var startIso = String(slotsLivre[i].get('start_at') || '')
      var startMs = Date.parse(startIso)
      if (isNaN(startMs)) continue
      if (startMs < corteAntecedenciaMs) continue
      var spDate = new Date(startMs + 3 * 3600 * 1000) // relógio SP
      var dia = spDate.toISOString().slice(0, 10)
      var hora = spDate.toISOString().slice(11, 16)
      if (!grupos[dia]) {
        grupos[dia] = []
        ordem.push(dia)
      }
      grupos[dia].push(hora)
      total++
    }

    ordem.sort()
    var days = []
    for (var g = 0; g < ordem.length; g++) {
      var diaG = ordem[g]
      var slotsDia = grupos[diaG]
      slotsDia.sort()
      days.push({ date: diaG, slots: slotsDia })
    }

    var resp = {
      mentorship_id: mentorshipId,
      mentor_id: mentorId,
      session_minutes: sessionMinutes,
      mes: mes,
      total: total,
      days: days,
    }

    return e.json(200, resp)
  },
  $apis.requireAuth(),
)
