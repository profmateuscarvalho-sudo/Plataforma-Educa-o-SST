migrate(
  (app) => {
    const collection = new Collection({
      name: 'access_events',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
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
          name: 'area',
          type: 'text',
          required: true,
          max: 60,
        },
        {
          name: 'event_type',
          type: 'select',
          required: true,
          values: ['login', 'page_view'],
          maxSelect: 1,
        },
        {
          name: 'meta',
          type: 'json',
          maxSize: 5242880,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_access_events_user ON access_events (user)',
        'CREATE INDEX idx_access_events_area ON access_events (area)',
        'CREATE INDEX idx_access_events_created ON access_events (created DESC)',
        'CREATE INDEX idx_access_events_user_created ON access_events (user, created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('access_events')
    app.delete(collection)
  },
)
