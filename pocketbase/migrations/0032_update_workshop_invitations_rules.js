migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('workshop_invitations')
    col.listRule = ''
    col.updateRule = ''
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('workshop_invitations')
    col.listRule = "@request.auth.role = 'admin'"
    col.updateRule = ''
    app.save(col)
  },
)
