migrate(
  (app) => {
    const collection = new Collection({
      name: 'banners',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'image',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          name: 'location',
          type: 'select',
          required: true,
          values: ['Home - Topo', 'Home - Meio', 'Lateral dos Artigos', 'Rodapé'],
        },
        { name: 'destination_link', type: 'url' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('banners'))
    } catch (_) {}
  },
)
