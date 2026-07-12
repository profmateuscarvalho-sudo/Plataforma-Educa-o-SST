migrate(
  (app) => {
    const usersCollectionId = '_pb_users_auth_'

    const professionalCases = new Collection({
      name: 'professional_cases',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersCollectionId,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(professionalCases)

    const casesCollectionId = app.findCollectionByNameOrId('professional_cases').id

    const caseComments = new Collection({
      name: 'case_comments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'case',
          type: 'relation',
          required: true,
          collectionId: casesCollectionId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersCollectionId,
          maxSelect: 1,
        },
        { name: 'content', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(caseComments)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('case_comments'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('professional_cases'))
    } catch (_) {}
  },
)
