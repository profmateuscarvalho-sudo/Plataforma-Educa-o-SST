migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('doc_projects')
    if (!col.fields.getByName('topics')) {
      col.fields.add(new JSONField({ name: 'topics' }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('doc_projects')
    col.fields.removeByName('topics')
    app.save(col)
  },
)
