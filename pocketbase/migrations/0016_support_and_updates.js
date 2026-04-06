migrate(
  (app) => {
    // 1. Update users collection to include contract_end_date
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('contract_end_date')) {
      users.fields.add(new DateField({ name: 'contract_end_date' }))
    }
    app.save(users)

    // 2. Update magazines collection to include embed_code
    const magazines = app.findCollectionByNameOrId('magazines')
    if (!magazines.fields.getByName('embed_code')) {
      magazines.fields.add(new TextField({ name: 'embed_code' }))
    }
    app.save(magazines)

    // 3. Create support_messages collection
    const supportCollection = new Collection({
      name: 'support_messages',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')",
      viewRule:
        "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'subject', type: 'text', required: true },
        { name: 'message', type: 'text', required: true },
        { name: 'status', type: 'select', required: true, values: ['pending', 'answered'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(supportCollection)
  },
  (app) => {
    try {
      const supportCollection = app.findCollectionByNameOrId('support_messages')
      app.delete(supportCollection)
    } catch (_) {}

    try {
      const users = app.findCollectionByNameOrId('users')
      users.fields.removeByName('contract_end_date')
      app.save(users)
    } catch (_) {}

    try {
      const magazines = app.findCollectionByNameOrId('magazines')
      magazines.fields.removeByName('embed_code')
      app.save(magazines)
    } catch (_) {}
  },
)
