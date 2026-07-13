migrate(
  (app) => {
    const liveCol = app.findCollectionByNameOrId('live_sessions')
    if (!liveCol.fields.getByName('instructor_bio')) {
      liveCol.fields.add(new EditorField({ name: 'instructor_bio' }))
    }
    if (!liveCol.fields.getByName('instructor_photo')) {
      liveCol.fields.add(
        new FileField({
          name: 'instructor_photo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png'],
        }),
      )
    }
    app.save(liveCol)

    const mentorCol = app.findCollectionByNameOrId('mentorships')
    if (!mentorCol.fields.getByName('mentor_bio')) {
      mentorCol.fields.add(new EditorField({ name: 'mentor_bio' }))
    }
    if (!mentorCol.fields.getByName('mentor_photo')) {
      mentorCol.fields.add(
        new FileField({
          name: 'mentor_photo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png'],
        }),
      )
    }
    app.save(mentorCol)

    const announcements = new Collection({
      name: 'platform_announcements',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'editor' },
        {
          name: 'type',
          type: 'select',
          values: ['Texto Customizado', 'Novo Curso', 'Documentário', 'Mentoria', 'Aula Ao Vivo'],
        },
        { name: 'reference_id', type: 'text' },
        { name: 'active', type: 'bool' },
        { name: 'priority', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(announcements)
  },
  (app) => {
    const liveCol = app.findCollectionByNameOrId('live_sessions')
    if (liveCol.fields.getByName('instructor_bio')) liveCol.fields.removeByName('instructor_bio')
    if (liveCol.fields.getByName('instructor_photo'))
      liveCol.fields.removeByName('instructor_photo')
    app.save(liveCol)

    const mentorCol = app.findCollectionByNameOrId('mentorships')
    if (mentorCol.fields.getByName('mentor_bio')) mentorCol.fields.removeByName('mentor_bio')
    if (mentorCol.fields.getByName('mentor_photo')) mentorCol.fields.removeByName('mentor_photo')
    app.save(mentorCol)

    try {
      app.delete(app.findCollectionByNameOrId('platform_announcements'))
    } catch (_) {}
  },
)
