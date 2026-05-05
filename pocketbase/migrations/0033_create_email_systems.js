migrate(
  (app) => {
    const smtpCollection = new Collection({
      name: 'smtp_settings',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'host', type: 'text', required: true },
        { name: 'port', type: 'number', required: true },
        { name: 'user', type: 'text', required: true },
        { name: 'password', type: 'text', required: true },
        { name: 'sender_name', type: 'text', required: true },
        { name: 'sender_email', type: 'text', required: true },
        {
          name: 'encryption',
          type: 'select',
          required: true,
          values: ['SSL', 'TLS', 'None'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(smtpCollection)

    const campaignsCollection = new Collection({
      name: 'email_campaigns',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'subject', type: 'text', required: true },
        { name: 'content', type: 'editor', required: true },
        { name: 'total_recipients', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['sent', 'failed'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(campaignsCollection)
  },
  (app) => {
    try {
      const smtp = app.findCollectionByNameOrId('smtp_settings')
      app.delete(smtp)
    } catch (_) {}
    try {
      const campaigns = app.findCollectionByNameOrId('email_campaigns')
      app.delete(campaigns)
    } catch (_) {}
  },
)
