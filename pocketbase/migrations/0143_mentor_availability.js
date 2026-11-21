// ---------------------------------------------------------------------------
// MENTORIAS — PARTE 1: disponibilidade do mentor
//  - mentor_availability: agenda semanal do mentor (dia da semana + faixas)
//  - mentor_blocked_dates: datas bloqueadas (férias, feriado, ...)
//  - mentorship_bookings: reservas de sessão (aluno vê só as próprias)
//  - mentors: email (avisos) e meeting_link (sala fixa Meet/Zoom)
//  - mentorships: session_minutes, min_notice_hours, weeks_ahead,
//    max_slots_per_purchase
// ---------------------------------------------------------------------------
migrate(
  (app) => {
    var mentorsId = app.findCollectionByNameOrId('mentors').id
    var usersId = '_pb_users_auth_'
    var mentorshipsId = app.findCollectionByNameOrId('mentorships').id
    var paymentsId = app.findCollectionByNameOrId('payments').id

    // --- campos novos em mentors ---
    var mentors = app.findCollectionByNameOrId('mentors')
    if (!mentors.fields.getByName('email')) {
      mentors.fields.add(new EmailField({ name: 'email' }))
    }
    if (!mentors.fields.getByName('meeting_link')) {
      mentors.fields.add(new URLField({ name: 'meeting_link' }))
    }
    app.save(mentors)

    // --- campos novos em mentorships ---
    var mentorships = app.findCollectionByNameOrId('mentorships')
    if (!mentorships.fields.getByName('session_minutes')) {
      mentorships.fields.add(new NumberField({ name: 'session_minutes', onlyInt: true, min: 15 }))
    }
    if (!mentorships.fields.getByName('min_notice_hours')) {
      mentorships.fields.add(new NumberField({ name: 'min_notice_hours', onlyInt: true, min: 0 }))
    }
    if (!mentorships.fields.getByName('weeks_ahead')) {
      mentorships.fields.add(new NumberField({ name: 'weeks_ahead', onlyInt: true, min: 1 }))
    }
    if (!mentorships.fields.getByName('max_slots_per_purchase')) {
      mentorships.fields.add(
        new NumberField({ name: 'max_slots_per_purchase', onlyInt: true, min: 1 }),
      )
    }
    app.save(mentorships)

    // --- mentor_availability (agenda semanal; leitura/escrita admin — o hook
    //     de horários lê via $app, que ignora regras) ---
    var availability = new Collection({
      name: 'mentor_availability',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'mentor',
          type: 'relation',
          required: true,
          collectionId: mentorsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'weekday', type: 'number', required: false, onlyInt: true, min: 0, max: 6 },
        {
          name: 'start_time',
          type: 'text',
          required: true,
          pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
        },
        { name: 'end_time', type: 'text', required: true, pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mentor_availability_mentor ON mentor_availability (mentor, active)',
      ],
    })
    app.save(availability)

    // --- mentor_blocked_dates (férias, feriado, ...) ---
    var blocked = new Collection({
      name: 'mentor_blocked_dates',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'mentor',
          type: 'relation',
          required: true,
          collectionId: mentorsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'date', type: 'date', required: true },
        { name: 'reason', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mentor_blocked_dates_mentor ON mentor_blocked_dates (mentor, date)',
      ],
    })
    app.save(blocked)

    // --- mentorship_bookings (aluno vê só as próprias; admin vê todas;
    //     criação via hook/painel — sem createRule público) ---
    var bookings = new Collection({
      name: 'mentorship_bookings',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)",
      createRule: null,
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'mentorship',
          type: 'relation',
          required: true,
          collectionId: mentorshipsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'mentor',
          type: 'relation',
          required: true,
          collectionId: mentorsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'payment',
          type: 'relation',
          collectionId: paymentsId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'start_at', type: 'date', required: true },
        { name: 'end_at', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['reservado', 'confirmado', 'cancelado', 'concluido'],
          maxSelect: 1,
          required: true,
        },
        { name: 'expires_at', type: 'date' },
        { name: 'meeting_link', type: 'url' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mentorship_bookings_mentor_start ON mentorship_bookings (mentor, start_at)',
        'CREATE INDEX idx_mentorship_bookings_user ON mentorship_bookings (user)',
        'CREATE INDEX idx_mentorship_bookings_status ON mentorship_bookings (status)',
      ],
    })
    app.save(bookings)
  },
  (app) => {
    var names = ['mentor_availability', 'mentor_blocked_dates', 'mentorship_bookings']
    for (var i = 0; i < names.length; i++) {
      try {
        app.delete(app.findCollectionByNameOrId(names[i]))
      } catch (_) {}
    }
    try {
      var m = app.findCollectionByNameOrId('mentorships')
      var namesM = ['session_minutes', 'min_notice_hours', 'weeks_ahead', 'max_slots_per_purchase']
      for (var j = 0; j < namesM.length; j++) {
        try {
          m.fields.removeByName(namesM[j])
        } catch (_) {}
      }
      app.save(m)
    } catch (_) {}
    try {
      var mt = app.findCollectionByNameOrId('mentors')
      try {
        mt.fields.removeByName('email')
      } catch (_) {}
      try {
        mt.fields.removeByName('meeting_link')
      } catch (_) {}
      app.save(mt)
    } catch (_) {}
  },
)
