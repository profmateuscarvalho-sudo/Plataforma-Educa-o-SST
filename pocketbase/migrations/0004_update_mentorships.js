migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('mentorships')

    if (!col.fields.getByName('mentor_name')) {
      col.fields.add(new TextField({ name: 'mentor_name', required: true }))
    }
    if (!col.fields.getByName('available_dates')) {
      col.fields.add(new TextField({ name: 'available_dates' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('mentorships')

    col.fields.removeByName('mentor_name')
    col.fields.removeByName('available_dates')

    app.save(col)
  },
)
