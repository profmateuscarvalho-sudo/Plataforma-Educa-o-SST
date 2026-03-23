migrate(
  (app) => {
    // Update Users
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(
      new SelectField({
        name: 'role',
        values: ['admin', 'student'],
        maxSelect: 1,
      }),
    )
    app.save(users)

    // Courses
    const courses = new Collection({
      name: 'courses',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        {
          name: 'category',
          type: 'select',
          values: ['Medicina do Trabalho', 'Segurança do Trabalho', 'Gestão de SST'],
        },
        { name: 'panda_video_id', type: 'text' },
        { name: 'price', type: 'number' },
        {
          name: 'thumbnail',
          type: 'file',
          maxSelect: 1,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(courses)

    // Magazines
    const magazines = new Collection({
      name: 'magazines',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'summary', type: 'text' },
        { name: 'fliphtml5_link', type: 'url' },
        { name: 'thumbnail', type: 'file', maxSelect: 1, mimeTypes: ['image/jpeg', 'image/png'] },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(magazines)

    // News
    const news = new Collection({
      name: 'news',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'editor' },
        { name: 'image', type: 'file', maxSelect: 1, mimeTypes: ['image/jpeg', 'image/png'] },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(news)

    // Mentorships
    const mentorships = new Collection({
      name: 'mentorships',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'price', type: 'number' },
        { name: 'scheduling_link', type: 'url' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(mentorships)

    // Leads
    const leads = new Collection({
      name: 'leads',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
        { name: 'message', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(leads)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('leads'))
    app.delete(app.findCollectionByNameOrId('mentorships'))
    app.delete(app.findCollectionByNameOrId('news'))
    app.delete(app.findCollectionByNameOrId('magazines'))
    app.delete(app.findCollectionByNameOrId('courses'))

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('role')
    app.save(users)
  },
)
