migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('professional_cases')
    col.updateRule =
      "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')"
    col.deleteRule =
      "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('professional_cases')
    col.updateRule = "@request.auth.id != '' && user = @request.auth.id"
    col.deleteRule = "@request.auth.id != '' && user = @request.auth.id"
    app.save(col)
  },
)
