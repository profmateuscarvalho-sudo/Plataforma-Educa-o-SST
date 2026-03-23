migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('events')
    if (!col.fields.getByName('end_date')) {
      col.fields.add(new DateField({ name: 'end_date' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('events')
    col.fields.removeByName('end_date')
    app.save(col)
  },
)
