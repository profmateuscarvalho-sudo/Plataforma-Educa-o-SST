migrate(
  (app) => {
    const col = new Collection({
      name: 'doc_project_guests',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'project',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('doc_projects').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'bio', type: 'text' },
        {
          name: 'photo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('doc_project_guests')
    app.delete(col)
  },
)
