migrate(
  (app) => {
    const events = app.findCollectionByNameOrId('events')
    const invites = app.findCollectionByNameOrId('workshop_invitations')

    try {
      app.findFirstRecordByData(
        'events',
        'title',
        'Workshop: Os fatores Psicossociais e a Espiritualidade no trabalho',
      )
      return // already seeded
    } catch (_) {}

    const event = new Record(events)
    event.set('title', 'Workshop: Os fatores Psicossociais e a Espiritualidade no trabalho')
    event.set(
      'description',
      'Um evento focado no bem-estar, saúde mental e espiritualidade no ambiente corporativo.',
    )
    event.set('type', 'Aula Presencial')
    event.set('date', '2026-06-26T08:00:00.000Z')
    event.set('end_date', '2026-06-26T13:00:00.000Z')
    event.set('price', 0)
    event.set('location', 'Auditório da Sicredi')
    event.set('is_workshop', true)
    event.set('speakers', [
      { name: 'Mateus', topic: 'Introdução e articulação dos fatores psicossociais com a NR 01' },
      { name: 'Jair', topic: 'O trabalho do conselheiro Espiritual' },
      { name: 'Ricardo Funari | Synchro', topic: 'O impacto da HWAW nas organizações' },
      {
        name: 'Manoel de Cesare Filho | ATM',
        topic: 'Estudo de caso e mudança de paradigma organizacional',
      },
      {
        name: 'Prof. Dr. Marcioni',
        topic: 'O que é a Espiritualidade no Trabalho e seus impactos na organização.',
      },
    ])
    event.set('structure', ['Café da manhã', 'Cooffe'])
    event.set('sponsorship_value', 10000)
    event.set('objectives', [
      'Apresentar a articulação da NR 01 com a espiritualidade corporativa',
      'Estudar casos de mudança de paradigma organizacional',
    ])
    event.set(
      'importance',
      '<p>A saúde mental no trabalho (HWAW) e os Fatores Psicossociais são fundamentais para o desenvolvimento humano na era moderna.</p>',
    )
    app.save(event)

    const invite = new Record(invites)
    invite.set('event', event.id)
    invite.set('guest_name', 'João Silva Empresário')
    invite.set('slug', 'joao-silva-empresario')
    invite.set('status', 'pending')
    app.save(invite)
  },
  (app) => {},
)
