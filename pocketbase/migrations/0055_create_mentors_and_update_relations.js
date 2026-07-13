migrate(
  (app) => {
    const mentorsCol = new Collection({
      name: 'mentors',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'mini_cv', type: 'editor', required: true },
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
    app.save(mentorsCol)

    const mentorshipsCol = app.findCollectionByNameOrId('mentorships')
    if (!mentorshipsCol.fields.getByName('mentor')) {
      mentorshipsCol.fields.add(
        new RelationField({
          name: 'mentor',
          collectionId: mentorsCol.id,
          maxSelect: 1,
        }),
      )
    }
    if (!mentorshipsCol.fields.getByName('available_slots')) {
      mentorshipsCol.fields.add(new JSONField({ name: 'available_slots' }))
    }
    app.save(mentorshipsCol)

    const liveCol = app.findCollectionByNameOrId('live_sessions')
    if (!liveCol.fields.getByName('mentor')) {
      liveCol.fields.add(
        new RelationField({
          name: 'mentor',
          collectionId: mentorsCol.id,
          maxSelect: 1,
        }),
      )
    }
    app.save(liveCol)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('mentors'))
    } catch (_) {}

    const mentorshipsCol = app.findCollectionByNameOrId('mentorships')
    if (mentorshipsCol.fields.getByName('mentor')) mentorshipsCol.fields.removeByName('mentor')
    if (mentorshipsCol.fields.getByName('available_slots'))
      mentorshipsCol.fields.removeByName('available_slots')
    app.save(mentorshipsCol)

    const liveCol = app.findCollectionByNameOrId('live_sessions')
    if (liveCol.fields.getByName('mentor')) liveCol.fields.removeByName('mentor')
    app.save(liveCol)
  },
)
