migrate(
  (app) => {
    const events = app.findCollectionByNameOrId('events')

    if (!events.fields.getByName('is_workshop')) {
      events.fields.add(new BoolField({ name: 'is_workshop' }))
      events.fields.add(new JSONField({ name: 'speakers' }))
      events.fields.add(new JSONField({ name: 'structure' }))
      events.fields.add(new EditorField({ name: 'importance' }))
      events.fields.add(new JSONField({ name: 'objectives' }))
      events.fields.add(new NumberField({ name: 'sponsorship_value' }))
      app.save(events)
    }

    const invites = new Collection({
      name: 'workshop_invitations',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: '',
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'event', type: 'relation', required: true, collectionId: events.id, maxSelect: 1 },
        { name: 'guest_name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pending', 'confirmed', 'declined'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_workshop_inv_slug ON workshop_invitations (slug)'],
    })
    app.save(invites)
  },
  (app) => {
    const invites = app.findCollectionByNameOrId('workshop_invitations')
    app.delete(invites)
  },
)
