// Reserva de horários de mentoria (Parte 2).
//
// POST /backend/v1/mentorias/{id}/reservar
// Body: { slots: [{ date: 'YYYY-MM-DD', time: 'HH:mm' }, ...] }
//
// Cria registros mentorship_bookings com status 'reservado' e
// expires_at = agora + 30 min, ATOMICAMENTE: revalida cada horário contra
// mentor_availability e contra bookings existentes (reservado não expirado ou
// confirmado). Se QUALQUER slot estiver ocupado, nada é gravado e devolve 409
// com a lista dos ocupados — duas contas correndo: só a primeira grava.
//
// JSVM: toda a lógica inline no callback (sem referência a top-level).
routerAdd(
  'POST',
  '/backend/v1/mentorias/{id}/reservar',
  (e) => {
    const mentorshipId = e.request.pathValue('id')
    const userId = e.auth ? e.auth.id : ''
    if (!userId) throw new UnauthorizedError('auth required')

    const body = e.requestInfo().body || {}
    const slots = Array.isArray(body.slots) ? body.slots : []
    if (slots.length === 0) {
      throw new BadRequestError('Selecione pelo menos um horário.')
    }

    let mentorshipRec
    try {
      mentorshipRec = $app.findRecordById('mentorships', mentorshipId)
    } catch (_) {
      throw new NotFoundError('Mentoria não encontrada.')
    }

    // Limite de horários por compra (default 4)
    var maxSlots = 4
    try {
      var ms = Number(mentorshipRec.get('max_slots_per_purchase') || 0)
      if (ms > 0) maxSlots = ms
    } catch (_) {}
    if (slots.length > maxSlots) {
      throw new BadRequestError(
        'Você pode escolher no máximo ' + maxSlots + ' horário(s) por compra.',
      )
    }

    // Normaliza e valida os slots
    var normalized = []
    var seen = {}
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i] || {}
      var date = String(s.date || '').trim()
      var time = String(s.time || '').trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
        throw new BadRequestError('Horário inválido: ' + date + ' ' + time)
      }
      var key = date + ' ' + time
      if (seen[key]) continue
      seen[key] = true
      normalized.push({ date: date, time: time })
    }
    if (normalized.length === 0) {
      throw new BadRequestError('Selecione pelo menos um horário.')
    }

    // Duracao da sessao e mentor
    var durationMin = 60
    try {
      var dur = Number(mentorshipRec.get('duration_minutes') || 0)
      if (dur > 0) durationMin = dur
    } catch (_) {}
    var mentorId = ''
    try {
      mentorId = String(mentorshipRec.get('mentor') || '')
    } catch (_) {}

    var now = new Date()
    var nowIso = now.toISOString()
    var expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString()
    var hoje = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)

    // Valida contra a disponibilidade cadastrada do mentor (Parte 1)
    var availability = []
    if (mentorId) {
      try {
        availability = $app.findRecordsByFilter(
          'mentor_availability',
          "mentor = '" + mentorId + "' && active = true",
          '',
          500,
          0,
        )
      } catch (_) {
        availability = []
      }
    }

    function slotEstaNaAgenda(date, time) {
      var weekday = new Date(date + 'T12:00:00Z').getUTCDay()
      var mins = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
      for (var i = 0; i < availability.length; i++) {
        var a = availability[i]
        var dow = -1
        try {
          dow = Number(a.get('weekday') || -1)
        } catch (_) {}
        if (dow !== weekday) continue
        var active = true
        try {
          active = Boolean(a.get('active'))
        } catch (_) {}
        if (!active) continue
        var from = ''
        var to = ''
        var fromD = ''
        try {
          from = String(a.get('start_time') || '')
          to = String(a.get('end_time') || '')
          fromD = String(a.get('start_date') || '')
        } catch (_) {}
        if (fromD && fromD > date) continue
        var startM = Number(from.slice(0, 2)) * 60 + Number(from.slice(3, 5))
        var endM = Number(to.slice(0, 2)) * 60 + Number(to.slice(3, 5))
        if (mins < startM || mins + durationMin > endM) continue
        return true
      }
      return false
    }

    // Ocupado = booking reservado (não expirado) OU confirmado no mesmo horário
    function slotOcupado(date, time) {
      var filtro =
        "mentorship = '" +
        mentorshipId +
        "' && slot_date = '" +
        date +
        "' && slot_time = '" +
        time +
        "' && (" +
        "status = 'confirmado' || (status = 'reservado' && expires_at > '" +
        nowIso +
        "'))"
      var found = []
      try {
        found = $app.findRecordsByFilter('mentorship_bookings', filtro, '', 1, 0)
      } catch (_) {
        found = []
      }
      return found && found.length > 0
    }

    var ocupados = []
    for (var j = 0; j < normalized.length; j++) {
      var sl = normalized[j]
      if (!slotEstaNaAgenda(sl.date, sl.time)) {
        throw new BadRequestError('Horário fora da agenda do mentor: ' + sl.date + ' ' + sl.time)
      }
      if (sl.date < hoje) {
        throw new BadRequestError('Não é possível reservar horário no passado.')
      }
      if (slotOcupado(sl.date, sl.time)) {
        ocupados.push({ date: sl.date, time: sl.time })
      }
    }
    if (ocupados.length > 0) {
      e.json(409, {
        error: 'Esse horário acabou de ser reservado, escolha outro',
        occupied: ocupados,
      })
      return
    }

    // Grava as reservas (cada slot vira um booking 'reservado')
    var bookingsCol = $app.findCollectionByNameOrId('mentorship_bookings')
    var created = []
    for (var k = 0; k < normalized.length; k++) {
      var bk = new Record(bookingsCol)
      bk.set('user', userId)
      bk.set('mentorship', mentorshipId)
      if (mentorId) bk.set('mentor', mentorId)
      bk.set('slot_date', normalized[k].date)
      bk.set('slot_time', normalized[k].time)
      bk.set('status', 'reservado')
      bk.set('expires_at', expiresAt)
      bk.set('payment', '')
      try {
        $app.save(bk)
        created.push({ id: bk.id, date: normalized[k].date, time: normalized[k].time })
      } catch (saveErr) {
        // Rollback: libera o que já foi gravado neste request
        for (var r = 0; r < created.length; r++) {
          try {
            $app.delete($app.findRecordById('mentorship_bookings', created[r].id))
          } catch (_) {}
        }
        throw new BadRequestError(
          'Horário acabou de ser reservado, escolha outro: ' + (saveErr.message || ''),
        )
      }
    }

    e.json(200, {
      ok: true,
      booking_ids: created.map(function (c) {
        return c.id
      }),
      expires_at: expiresAt,
      bookings: created,
    })
  },
  $apis.requireAuth(),
)
