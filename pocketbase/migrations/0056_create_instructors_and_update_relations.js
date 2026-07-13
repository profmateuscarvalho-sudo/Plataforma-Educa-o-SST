migrate(
  (app) => {
    const instructorsCol = new Collection({
      name: 'instructors',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'bio', type: 'editor', required: true },
        { name: 'topics', type: 'text', required: true },
        {
          name: 'photo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png'],
        },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(instructorsCol)

    const liveCol = app.findCollectionByNameOrId('live_sessions')
    if (!liveCol.fields.getByName('instructor')) {
      liveCol.fields.add(
        new RelationField({
          name: 'instructor',
          collectionId: instructorsCol.id,
          maxSelect: 1,
        }),
      )
    }
    app.save(liveCol)

    const paymentsCol = app.findCollectionByNameOrId('payments')
    if (!paymentsCol.fields.getByName('mentorship_id')) {
      paymentsCol.fields.add(new TextField({ name: 'mentorship_id' }))
    }
    if (!paymentsCol.fields.getByName('selected_slots')) {
      paymentsCol.fields.add(new JSONField({ name: 'selected_slots' }))
    }
    app.save(paymentsCol)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('instructors'))
    } catch (_) {}

    const liveCol = app.findCollectionByNameOrId('live_sessions')
    if (liveCol.fields.getByName('instructor')) liveCol.fields.removeByName('instructor')
    app.save(liveCol)

    const paymentsCol = app.findCollectionByNameOrId('payments')
    if (paymentsCol.fields.getByName('mentorship_id'))
      paymentsCol.fields.removeByName('mentorship_id')
    if (paymentsCol.fields.getByName('selected_slots'))
      paymentsCol.fields.removeByName('selected_slots')
    app.save(paymentsCol)
  },
)
