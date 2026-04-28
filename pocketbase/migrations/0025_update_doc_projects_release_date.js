migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('doc_projects')
    if (!col.fields.getByName('estimated_release_date')) {
      col.fields.add(new DateField({ name: 'estimated_release_date' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('doc_projects')
    col.fields.removeByName('estimated_release_date')
    app.save(col)
  },
)
