migrate(
  (app) => {
    const collection = new Collection({
      name: 'lista_espera',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'plano', type: 'text', required: true },
        { name: 'data', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_lista_espera_email ON lista_espera (email)',
        'CREATE INDEX idx_lista_espera_plano ON lista_espera (plano)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('lista_espera')
      app.delete(collection)
    } catch (_) {}
  },
)
