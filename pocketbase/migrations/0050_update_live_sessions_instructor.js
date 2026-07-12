migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('live_sessions')
    if (!col.fields.getByName('instructor_name')) {
      col.fields.add(new TextField({ name: 'instructor_name' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('live_sessions')
    col.fields.removeByName('instructor_name')
    app.save(col)
  },
)
