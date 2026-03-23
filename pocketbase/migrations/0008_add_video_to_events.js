migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('events')
    if (!col.fields.getByName('panda_video_id')) {
      col.fields.add(new TextField({ name: 'panda_video_id' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('events')
    const field = col.fields.getByName('panda_video_id')
    if (field) {
      col.fields.removeById(field.id)
    }
    app.save(col)
  },
)
