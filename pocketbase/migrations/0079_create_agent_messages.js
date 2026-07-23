migrate(
  (app) => {
    const col = new Collection({
      name: 'agent_messages',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')",
      viewRule:
        "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')",
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'content', type: 'text', required: true },
        {
          name: 'role',
          type: 'select',
          required: true,
          values: ['user', 'assistant'],
          maxSelect: 1,
        },
        { name: 'conversation_id', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_agent_messages_user_created ON agent_messages (user, created DESC)',
        'CREATE INDEX idx_agent_messages_conv ON agent_messages (conversation_id)',
      ],
    })
    app.save(col)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('agent_messages'))
  },
)
