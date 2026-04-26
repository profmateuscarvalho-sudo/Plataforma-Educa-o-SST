migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('simulados')
    const bannerField = col.fields.getByName('banner')
    if (bannerField) {
      bannerField.required = false
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('simulados')
    const bannerField = col.fields.getByName('banner')
    if (bannerField) {
      bannerField.required = true
      app.save(col)
    }
  },
)
