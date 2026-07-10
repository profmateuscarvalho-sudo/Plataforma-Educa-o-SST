migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('news')
    if (!col.fields.getByName('category')) {
      col.fields.add(new TextField({ name: 'category', required: false }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('news')
    const field = col.fields.getByName('category')
    if (field) {
      col.fields.removeByName('category')
      app.save(col)
    }
  },
)
