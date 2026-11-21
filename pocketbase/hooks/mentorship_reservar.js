// ---------------------------------------------------------------------------
// MENTORIAS — RESERVA DE HORÁRIOS (novo modelo: mentorship_slots)
// POST /backend/v1/mentorias/{id}/reservar
// Body: { slots: ["2025-12-03T19:00:00.000Z", ...] } (start_at real do slot)
//
// Cria mentorship_bookings com status 'reservado' e expires_at = agora + 30
// min, ATOMICAMENTE: revalida cada slot contra mentorship_slots (status livre,
// ou reservado com reserva expirada), contra o passado e contra a antecedência
// mínima de 24h. Se QUALQUER slot estiver ocupado, nada é gravado e devolve
// 409 com a lista dos ocupados — duas contas correndo: só a primeira grava.
//
// Requer autenticação (aluno). Respeita max_slots_per_purchase da mentoria.
//
// CONVENÇÃO JSVM: toda a lógica fica INLINE dentro do callback — declarações
// top-level no mesmo arquivo causam "Hook scoping error"; sem imports.
// ---------------------------------------------------------------------------
routerAdd(
  'POST',
  '/backend/v1/mentorias/{id}/reservar',
  (e) => {
    var userId = ''
    try {
      if (e.auth && e.auth.id) userId = String(e.auth.id)
    } catch (_) {}
    try {
      if (!userId && e.hasSuperuserAuth && e.hasSuperuserAuth()) userId = '__superuser__'
    } catch (_) {}
    if (!userId) {
      return e.json(401, { error: 'Autenticação necessária' })
    }

    var mentorshipId = ''
    var slotIds = []
    try {
      mentorshipId = String(e.request.pathValue('id') || '').trim()
      var body = e.requestInfo().body || {}
      var raw = Array.isArray(body.slots) ? body.slots : []
      for (var i = 0; i < raw.length; i++) {
        var v = String(raw[i] || '').trim()
        if (v) slotIds.push(v)
      }
    } catch (_) {}

    if (!mentorshipId) return e.json(400, { error: 'Id da mentoria é obrigatório' })
    if (slotIds.length === 0) return e.json(400, { error: 'Selecione pelo menos um horário.' })

    var mentoria = null
    try {
      mentoria = $app.findRecordById('mentorships', mentorshipId)
    } catch (_) {
      return e.json(404, { error: 'Mentoria não encontrada' })
    }
    if (!mentoria) return e.json(404, { error: 'Mentoria não encontrada' })

    var maxSlots = 4
    try {
      var ms = Number(mentoria.get('max_slots_per_purchase') || 0)
      if (ms > 0) maxSlots = Math.floor(ms)
    } catch (_) {}
    if (slotIds.length > maxSlots) {
      return e.json(400, {
        error: 'Você pode escolher no máximo ' + maxSlots + ' horário(s) por compra.',
      })
    }

    var agoraMs = Date.now()
    var corteAntecedenciaMs = agoraMs + 24 * 3600 * 1000
    var expiresAtIso = new Date(agoraMs + 30 * 60 * 1000).toISOString()

    // valida todos os slots ANTES de gravar (atomicidade: tudo ou nada)
    var validados = []
    var ocupados = []
    for (var k = 0; k < slotIds.length; k++) {
      var slot = null
      try {
        slot = $app.findRecordById('mentorship_slots', slotIds[k])
      } catch (_) {
        return e.json(400, { error: 'Horário não encontrado: ' + slotIds[k] })
      }
      if (!slot) return e.json(400, { error: 'Horário não encontrado: ' + slotIds[k] })

      try {
        var slotMentorship = String(slot.get('mentorship') || '')
        if (slotMentorship && slotMentorship !== mentorshipId) {
          return e.json(400, { error: 'Horário não pertence a esta mentoria.' })
        }
      } catch (_) {}

      var status = ''
      try {
        status = String(slot.get('status') || '')
      } catch (_) {}

      if (status === 'vendido' || status === 'bloqueado') {
        ocupados.push(slotIds[k])
        continue
      }
      if (status === 'livre') {
        // confere de novo: outro request pode ter reservado neste instante
        var ocupador1 = []
        try {
          ocupador1 = $app.findRecordsByFilter(
            'mentorship_bookings',
            "slot = '" +
              slotIds[k] +
              "' && (status = 'confirmado' || (status = 'reservado' && expires_at > '" +
              new Date(agoraMs).toISOString() +
              "'))",
            '',
            1,
            0,
          )
        } catch (_) {
          ocupador1 = []
        }
        if (ocupador1 && ocupador1.length > 0) {
          ocupados.push(slotIds[k])
          continue
        }
        validados.push({
          id: slotIds[k],
          status: status,
          start_at: String(slot.get('start_at') || ''),
        })
        continue
      }
      if (status === 'reservado') {
        // só aceita se a reserva anterior JÁ EXPIROU (vai ser retomada)
        var expirou = true
        try {
          var prevBookingId = String(slot.get('booking') || '')
          if (prevBookingId) {
            var prev = $app.findRecordById('mentorship_bookings', prevBookingId)
            var prevExp = Date.parse(String(prev.get('expires_at') || ''))
            if (!isNaN(prevExp) && prevExp > agoraMs) expirou = false
          }
        } catch (_) {
          expirou = true // booking sumiu → reserva morta
        }
        if (!expirou) {
          ocupados.push(slotIds[k])
          continue
        }
        validados.push({
          id: slotIds[k],
          status: status,
          start_at: String(slot.get('start_at') || ''),
        })
        continue
      }
      // status desconhecido → trata como ocupado
      ocupados.push(slotIds[k])
    }

    if (ocupados.length > 0) {
      return e.json(409, {
        error: 'Esse horário acabou de ser reservado, escolha outro',
        occupied: ocupados,
      })
    }

    // revalida passado / antecedência mínima de 24h
    for (var v = 0; v < validados.length; v++) {
      var startMs = NaN
      try {
        startMs = Date.parse(String(validados[v].start_at || ''))
      } catch (_) {}
      if (isNaN(startMs) || startMs < corteAntecedenciaMs) {
        return e.json(400, {
          error: 'Horário no passado ou com menos de 24h de antecedência: ' + slotIds[v],
        })
      }
    }

    // grava: para cada slot, um booking 'reservado' + slot → reservado
    var bookingsCol
    try {
      bookingsCol = $app.findCollectionByNameOrId('mentorship_bookings')
    } catch (colErr) {
      return e.json(500, { error: 'Coleção mentorship_bookings ausente: ' + colErr })
    }
    var created = []
    for (var w = 0; w < validados.length; w++) {
      var slotRec = null
      try {
        slotRec = $app.findRecordById('mentorship_slots', validados[w].id)
      } catch (_) {
        slotRec = null
      }
      if (!slotRec) {
        // rollback do que já foi gravado neste request
        for (var rb = 0; rb < created.length; rb++) {
          try {
            $app.delete($app.findRecordById('mentorship_bookings', created[rb].id))
          } catch (_) {}
          try {
            var s2 = $app.findRecordById('mentorship_slots', created[rb].slotId)
            s2.set('status', 'livre')
            s2.set('booking', '')
            $app.save(s2)
          } catch (_) {}
        }
        return e.json(409, { error: 'Esse horário acabou de ser reservado, escolha outro' })
      }

      var bk = new Record(bookingsCol)
      try {
        var mentorId = ''
        try {
          mentorId = String(slotRec.get('mentor') || String(mentoria.get('mentor') || ''))
        } catch (_) {}
        var startIso = String(slotRec.get('start_at') || '')
        var endIso = String(slotRec.get('end_at') || '')

        bk.set('user', userId === '__superuser__' ? '' : userId)
        bk.set('mentorship', mentorshipId)
        if (mentorId) bk.set('mentor', mentorId)
        bk.set('slot', slotRec.id)
        bk.set('payment', '')
        bk.set('status', 'reservado')
        bk.set('expires_at', expiresAtIso)
        if (startIso) bk.set('start_at', startIso)
        if (endIso) bk.set('end_at', endIso)
        $app.save(bk)

        slotRec.set('status', 'reservado')
        slotRec.set('booking', bk.id)
        $app.save(slotRec)

        created.push({ id: bk.id, slotId: slotRec.id })
      } catch (saveErr) {
        // rollback: libera o que já foi gravado neste request
        for (var r2 = 0; r2 < created.length; r2++) {
          try {
            $app.delete($app.findRecordById('mentorship_bookings', created[r2].id))
          } catch (_) {}
          try {
            var s3 = $app.findRecordById('mentorship_slots', created[r2].slotId)
            s3.set('status', 'livre')
            s3.set('booking', '')
            $app.save(s3)
          } catch (_) {}
        }
        return e.json(409, {
          error: 'Esse horário acabou de ser reservado, escolha outro',
          occupied: [validados[w].id],
          detail: saveErr && saveErr.message ? saveErr.message : String(saveErr),
        })
      }
    }

    return e.json(200, {
      ok: true,
      booking_ids: created.map(function (c) {
        return c.id
      }),
      expires_at: expiresAtIso,
    })
  },
  $apis.requireAuth(),
)
