migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('live_messages')

    const userField = col.fields.getByName('user')
    if (userField) {
      userField.required = false
    }

    const sessionField = col.fields.getByName('session')
    if (sessionField) {
      sessionField.required = false
    }

    col.fields.add(
      new RelationField({
        name: 'event',
        collectionId: app.findCollectionByNameOrId('events').id,
        maxSelect: 1,
      }),
    )
    col.fields.add(new TextField({ name: 'speaker_name' }))
    col.fields.add(new TextField({ name: 'author_name' }))
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['pending', 'active', 'answered', 'hidden'],
        maxSelect: 1,
      }),
    )

    col.createRule = ''
    col.updateRule =
      "@request.auth.role = 'admin' || (@request.auth.id != '' && user = @request.auth.id)"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('live_messages')

    const userField = col.fields.getByName('user')
    if (userField) {
      userField.required = true
    }

    const sessionField = col.fields.getByName('session')
    if (sessionField) {
      sessionField.required = true
    }

    col.fields.removeByName('event')
    col.fields.removeByName('speaker_name')
    col.fields.removeByName('author_name')
    col.fields.removeByName('status')

    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != '' && user = @request.auth.id"

    app.save(col)
  },
)
