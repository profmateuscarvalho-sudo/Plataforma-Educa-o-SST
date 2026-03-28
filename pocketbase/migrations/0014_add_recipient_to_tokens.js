migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('submission_tokens')
    col.fields.add(new TextField({ name: 'recipient_name' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('submission_tokens')
    col.fields.removeByName('recipient_name')
    app.save(col)
  },
)
