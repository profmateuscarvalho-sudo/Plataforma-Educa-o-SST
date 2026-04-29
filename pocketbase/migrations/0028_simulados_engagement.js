migrate(
  (app) => {
    const simulados = app.findCollectionByNameOrId('simulados')
    if (!simulados.fields.getByName('access_count')) {
      simulados.fields.add(new NumberField({ name: 'access_count' }))
    }
    app.save(simulados)

    const submissions = app.findCollectionByNameOrId('simulado_submissions')
    const userField = submissions.fields.getByName('user')
    if (userField) {
      userField.required = false
    }
    submissions.createRule = ''
    submissions.listRule =
      "@request.auth.role = 'admin' || (@request.auth.id != '' && user = @request.auth.id)"
    submissions.viewRule =
      "@request.auth.role = 'admin' || (@request.auth.id != '' && user = @request.auth.id)"
    app.save(submissions)
  },
  (app) => {
    const simulados = app.findCollectionByNameOrId('simulados')
    simulados.fields.removeByName('access_count')
    app.save(simulados)

    const submissions = app.findCollectionByNameOrId('simulado_submissions')
    const userField = submissions.fields.getByName('user')
    if (userField) {
      userField.required = true
    }
    submissions.createRule = "@request.auth.id != ''"
    submissions.listRule = "@request.auth.role = 'admin' || user = @request.auth.id"
    submissions.viewRule = "@request.auth.role = 'admin' || user = @request.auth.id"
    app.save(submissions)
  },
)
