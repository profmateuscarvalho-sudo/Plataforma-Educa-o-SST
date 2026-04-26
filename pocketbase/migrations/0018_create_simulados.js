migrate(
  (app) => {
    const simulados = new Collection({
      name: 'simulados',
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
          name: 'banner',
          type: 'file',
          required: true,
          maxSelect: 1,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(simulados)

    const simuladoQuestions = new Collection({
      name: 'simulado_questions',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'simulado',
          type: 'relation',
          required: true,
          collectionId: simulados.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'question', type: 'text', required: true },
        { name: 'options', type: 'json', required: true },
        { name: 'correct_option', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(simuladoQuestions)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('simulado_questions'))
      app.delete(app.findCollectionByNameOrId('simulados'))
    } catch (_) {}
  },
)
