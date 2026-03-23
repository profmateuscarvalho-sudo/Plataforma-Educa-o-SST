migrate(
  (app) => {
    const eventsCol = app.findCollectionByNameOrId('events')
    const col = new Collection({
      name: 'event_registrations',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'event',
          type: 'relation',
          required: true,
          collectionId: eventsCol.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['confirmed', 'pending', 'cancelled'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('event_registrations')
    app.delete(col)
  },
)
