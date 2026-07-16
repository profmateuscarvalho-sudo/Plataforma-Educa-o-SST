migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('doc_projects')
    if (!col.fields.getByName('youtube_url')) {
      col.fields.add(new URLField({ name: 'youtube_url' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('doc_projects')
    col.fields.removeByName('youtube_url')
    app.save(col)
  },
)
