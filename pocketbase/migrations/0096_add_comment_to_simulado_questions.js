migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('simulado_questions')
    if (!col.fields.getByName('comment')) {
      col.fields.add(
        new TextField({
          name: 'comment',
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('simulado_questions')
      const field = col.fields.getByName('comment')
      if (field) {
        col.fields.removeByName('comment')
        app.save(col)
      }
    } catch (_) {}
  },
)
