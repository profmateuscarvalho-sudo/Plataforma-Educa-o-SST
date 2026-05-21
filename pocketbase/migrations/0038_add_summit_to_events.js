migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('events')
    const typeField = collection.fields.getByName('type')

    if (typeField && typeField.selectValues) {
      if (!typeField.selectValues.includes('Summit')) {
        typeField.selectValues.push('Summit')
        app.save(collection)
      }
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('events')
    const typeField = collection.fields.getByName('type')

    if (typeField && typeField.selectValues) {
      typeField.selectValues = typeField.selectValues.filter((v) => v !== 'Summit')
      app.save(collection)
    }
  },
)
