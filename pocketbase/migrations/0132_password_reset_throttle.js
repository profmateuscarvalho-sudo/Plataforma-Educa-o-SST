migrate(
  (app) => {
    // idempotente: se já existe, nada a fazer
    try {
      app.findCollectionByNameOrId('password_reset_throttle')
      return
    } catch (_) {}

    var col = new Collection({
      name: 'password_reset_throttle',
      type: 'base',
      // nenhuma API pública — só o hook acessa via $app
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'email', type: 'text', required: true },
        { name: 'requests', type: 'number' },
        { name: 'ip', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_prt_email ON password_reset_throttle (email)',
        'CREATE INDEX idx_prt_ip ON password_reset_throttle (ip)',
      ],
    })
    app.save(col)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('password_reset_throttle'))
    } catch (_) {}
  },
)
