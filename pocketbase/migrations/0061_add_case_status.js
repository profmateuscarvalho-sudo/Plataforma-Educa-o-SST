migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('professional_cases')
    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({
          name: 'status',
          values: ['pending', 'approved'],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)

    app
      .db()
      .newQuery(
        "UPDATE professional_cases SET status = 'approved' WHERE status IS NULL OR status = ''",
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('professional_cases')
    const field = col.fields.getByName('status')
    if (field) col.fields.remove(field.id)
    app.save(col)
  },
)
