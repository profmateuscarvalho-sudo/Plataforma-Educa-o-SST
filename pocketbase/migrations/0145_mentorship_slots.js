// ---------------------------------------------------------------------------
// MENTORIAS — PARTE 1 (NOVO MODELO): slots explícitos por data/hora.
//  - mentorship_slots: cada horário disponível é um registro (livre/reservado/
//    vendido/bloqueado), criado pelo admin no calendário mensal.
//  - mentorship_bookings ganha o campo slot (relation → mentorship_slots).
//  - Garante (idempotente) mentors.email/meeting_link e mentorships.
//    session_minutes/max_slots_per_purchase.
//  mentor_availability / mentor_blocked_dates (v0.0.383) ficam FORA DE CENA:
//  nenhuma tela alimenta mais essas coleções, mas elas NÃO são apagadas.
// ---------------------------------------------------------------------------
migrate(
  (app) => {
    var mentorsId = app.findCollectionByNameOrId('mentors').id
    var mentorshipsId = app.findCollectionByNameOrId('mentorships').id
    var bookingsId = app.findCollectionByNameOrId('mentorship_bookings').id

    // --- garantia de campos em mentors (reaproveitados da v0.0.383) ---
    var mentors = app.findCollectionByNameOrId('mentors')
    if (!mentors.fields.getByName('email')) {
      mentors.fields.add(new EmailField({ name: 'email' }))
    }
    if (!mentors.fields.getByName('meeting_link')) {
      mentors.fields.add(new URLField({ name: 'meeting_link' }))
    }
    app.save(mentors)

    // --- garantia de campos em mentorships (reaproveitados da v0.0.383) ---
    var mentorships = app.findCollectionByNameOrId('mentorships')
    if (!mentorships.fields.getByName('session_minutes')) {
      mentorships.fields.add(new NumberField({ name: 'session_minutes', onlyInt: true, min: 15 }))
    }
    if (!mentorships.fields.getByName('max_slots_per_purchase')) {
      mentorships.fields.add(
        new NumberField({ name: 'max_slots_per_purchase', onlyInt: true, min: 1 }),
      )
    }
    app.save(mentorships)

    // --- mentorship_slots (o calendário mensal do admin) ---
    var slots = new Collection({
      name: 'mentorship_slots',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
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
          collectionId: mentorsId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'start_at', type: 'date', required: true },
        { name: 'end_at', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['livre', 'reservado', 'vendido', 'bloqueado'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'booking',
          type: 'relation',
          collectionId: bookingsId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mentorship_slots_ms ON mentorship_slots (mentorship, start_at)',
        'CREATE INDEX idx_mentorship_slots_status ON mentorship_slots (mentorship, status)',
      ],
    })
    app.save(slots)

    // --- mentorship_bookings: campo slot (relação com o slot reservado) ---
    var bookings = app.findCollectionByNameOrId('mentorship_bookings')
    if (!bookings.fields.getByName('slot')) {
      bookings.fields.add(
        new RelationField({
          name: 'slot',
          collectionId: slots.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    app.save(bookings)
  },
  (app) => {
    try {
      var b = app.findCollectionByNameOrId('mentorship_bookings')
      try {
        b.fields.removeByName('slot')
      } catch (_) {}
      app.save(b)
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('mentorship_slots'))
    } catch (_) {}
  },
)
