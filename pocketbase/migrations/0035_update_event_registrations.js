migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('event_registrations')

    if (!col.fields.getByName('position')) {
      col.fields.add(new TextField({ name: 'position' }))
    }

    if (!col.fields.getByName('extra_guests')) {
      col.fields.add(new JSONField({ name: 'extra_guests', maxSize: 2000000 }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('event_registrations')
    col.fields.removeByName('position')
    col.fields.removeByName('extra_guests')
    app.save(col)
  },
)
