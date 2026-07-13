migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payments')
    col.listRule = 'user = @request.auth.id'
    col.viewRule = 'user = @request.auth.id'
    col.createRule = null
    col.updateRule = null
    col.deleteRule = null
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('payments')
    col.listRule = "@request.auth.role = 'admin' || user = @request.auth.id"
    col.viewRule = "@request.auth.role = 'admin' || user = @request.auth.id"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.role = 'admin'"
    col.deleteRule = "@request.auth.role = 'admin'"
    app.save(col)
  },
)
