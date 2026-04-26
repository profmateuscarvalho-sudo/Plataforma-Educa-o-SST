migrate(
  (app) => {
    const collection = new Collection({
      name: 'workplaces',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'professional_name', type: 'text', required: true },
        { name: 'job_title', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        {
          name: 'photos',
          type: 'file',
          required: false,
          maxSelect: 3,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('workplaces')
    app.delete(collection)
  },
)
