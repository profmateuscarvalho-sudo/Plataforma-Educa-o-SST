migrate(
  (app) => {
    const col = new Collection({
      name: 'agent_limits_config',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'limit_free', type: 'number', required: true },
        { name: 'limit_prata', type: 'number', required: true },
        { name: 'limit_ouro', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(col)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('agent_limits_config'))
  },
)
