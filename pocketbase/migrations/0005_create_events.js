migrate(
  (app) => {
    const collection = new Collection({
      name: 'events',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['Workshop', 'Aula Online', 'Aula Presencial'],
          maxSelect: 1,
        },
        { name: 'date', type: 'date', required: true },
        { name: 'price', type: 'number', required: true },
        { name: 'location', type: 'text' },
        { name: 'meeting_link', type: 'url' },
        {
          name: 'thumbnail',
          type: 'file',
          maxSelect: 1,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('events')
    app.delete(collection)
  },
)
