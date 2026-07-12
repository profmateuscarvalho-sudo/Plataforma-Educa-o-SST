migrate(
  (app) => {
    const names = ['courses', 'magazines', 'mentorships', 'simulados', 'doc_projects']
    for (const name of names) {
      const col = app.findCollectionByNameOrId(name)
      if (!col.fields.getByName('is_free')) {
        col.fields.add(new BoolField({ name: 'is_free' }))
      }
      app.save(col)
    }
  },
  (app) => {
    const names = ['courses', 'magazines', 'mentorships', 'simulados', 'doc_projects']
    for (const name of names) {
      const col = app.findCollectionByNameOrId(name)
      if (col.fields.getByName('is_free')) {
        col.fields.removeByName('is_free')
      }
      app.save(col)
    }
  },
)
