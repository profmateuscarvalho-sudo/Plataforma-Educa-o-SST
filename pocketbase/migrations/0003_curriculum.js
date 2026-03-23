migrate(
  (app) => {
    const courses = app.findCollectionByNameOrId('courses')

    const modules = new Collection({
      name: 'modules',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'order', type: 'number' },
        {
          name: 'course',
          type: 'relation',
          required: true,
          collectionId: courses.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(modules)

    const lessons = new Collection({
      name: 'lessons',
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
        { name: 'order', type: 'number' },
        {
          name: 'module',
          type: 'relation',
          required: true,
          collectionId: modules.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(lessons)

    const materials = new Collection({
      name: 'materials',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'file', type: 'file', required: true, maxSelect: 1, maxSize: 52428800 },
        {
          name: 'module',
          type: 'relation',
          required: true,
          collectionId: modules.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(materials)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('materials'))
    app.delete(app.findCollectionByNameOrId('lessons'))
    app.delete(app.findCollectionByNameOrId('modules'))
  },
)
