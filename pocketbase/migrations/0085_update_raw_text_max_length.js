migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('knowledge_entries')
    const field = col.fields.getByName('raw_text')
    if (field) {
      field.max = 100000
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('knowledge_entries')
    const field = col.fields.getByName('raw_text')
    if (field) {
      field.max = 0
    }
    app.save(col)
  },
)
