migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('city')) {
      col.fields.add(new TextField({ name: 'city' }))
    }

    if (!col.fields.getByName('state')) {
      col.fields.add(new TextField({ name: 'state' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    if (col.fields.getByName('city')) col.fields.removeByName('city')
    if (col.fields.getByName('state')) col.fields.removeByName('state')
    app.save(col)
  },
)
