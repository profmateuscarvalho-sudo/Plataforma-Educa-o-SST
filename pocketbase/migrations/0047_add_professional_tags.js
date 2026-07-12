migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('professional_tags')) {
      col.fields.add(new JSONField({ name: 'professional_tags' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    if (col.fields.getByName('professional_tags')) {
      col.fields.removeByName('professional_tags')
    }
    app.save(col)
  },
)
