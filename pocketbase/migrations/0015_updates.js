migrate(
  (app) => {
    const newsCol = app.findCollectionByNameOrId('news')
    const imgField = newsCol.fields.getByName('image')
    if (imgField) {
      imgField.maxSelect = 10
    }

    if (!newsCol.fields.getByName('images')) {
      newsCol.fields.add(new FileField({ name: 'images', maxSelect: 10 }))
    }
    app.save(newsCol)

    const payments = new Collection({
      name: 'payments',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || user = @request.auth.id",
      viewRule: "@request.auth.role = 'admin' || user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'amount', type: 'number', required: true },
        { name: 'status', type: 'select', required: true, values: ['pending', 'paid', 'failed'] },
        { name: 'ipag_id', type: 'text' },
        { name: 'product_type', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(payments)

    const lessonCompletions = new Collection({
      name: 'lesson_completions',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
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
          name: 'lesson',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('lessons').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_user_lesson_comp ON lesson_completions (user, lesson)'],
    })
    app.save(lessonCompletions)

    const lessonRatings = new Collection({
      name: 'lesson_ratings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.role = 'admin'",
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
          name: 'lesson',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('lessons').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
        { name: 'comment', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(lessonRatings)

    const liveSessions = new Collection({
      name: 'live_sessions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'panda_video_id', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['scheduled', 'live', 'finished'],
        },
        { name: 'scheduled_at', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(liveSessions)

    const liveMessages = new Collection({
      name: 'live_messages',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.role = 'admin'",
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
          name: 'session',
          type: 'relation',
          required: true,
          collectionId: liveSessions.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'content', type: 'text', required: true },
        { name: 'is_question', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(liveMessages)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('live_messages'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('live_sessions'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('lesson_ratings'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('lesson_completions'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('payments'))
    } catch (_) {}

    const newsCol = app.findCollectionByNameOrId('news')
    const imgField = newsCol.fields.getByName('image')
    if (imgField) {
      imgField.maxSelect = 1
    }
    app.save(newsCol)
  },
)
