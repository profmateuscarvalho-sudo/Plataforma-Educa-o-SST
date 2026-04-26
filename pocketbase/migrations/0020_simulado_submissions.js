migrate(
  (app) => {
    const simuladosCol = app.findCollectionByNameOrId('simulados')
    const collection = new Collection({
      name: 'simulado_submissions',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || user = @request.auth.id",
      viewRule: "@request.auth.role = 'admin' || user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'simulado',
          type: 'relation',
          required: true,
          collectionId: simuladosCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('simulado_submissions')
    app.delete(collection)
  },
)
