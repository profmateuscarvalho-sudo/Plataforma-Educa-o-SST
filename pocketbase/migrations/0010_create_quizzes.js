migrate(
  (app) => {
    const modules = app.findCollectionByNameOrId('modules')

    const quizzes = new Collection({
      name: 'quizzes',
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
    app.save(quizzes)

    const quizQuestions = new Collection({
      name: 'quiz_questions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'quiz',
          type: 'relation',
          required: true,
          collectionId: quizzes.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'question', type: 'text', required: true },
        { name: 'options', type: 'json', required: true },
        { name: 'correct_option', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(quizQuestions)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('quiz_questions'))
    app.delete(app.findCollectionByNameOrId('quizzes'))
  },
)
