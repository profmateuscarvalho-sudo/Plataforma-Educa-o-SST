migrate(
  (app) => {
    const plansColId = app.findCollectionByNameOrId('subscription_plans').id

    const subscriptions = new Collection({
      name: 'subscriptions',
      type: 'base',
      listRule: 'user = @request.auth.id',
      viewRule: 'user = @request.auth.id',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pending', 'active'],
          maxSelect: 1,
        },
        { name: 'token', type: 'text' },
        {
          name: 'plan',
          type: 'relation',
          required: false,
          collectionId: plansColId,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_subscriptions_token ON subscriptions (token) WHERE token != ''",
      ],
    })

    app.save(subscriptions)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('subscriptions'))
  },
)
