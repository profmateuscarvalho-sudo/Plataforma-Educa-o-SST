migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('magazines')
    col.fields.add(new BoolField({ name: 'is_featured' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('magazines')
    col.fields.removeByName('is_featured')
    app.save(col)
  },
)
