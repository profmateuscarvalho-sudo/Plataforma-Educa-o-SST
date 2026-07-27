migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('news')

    const imageField = collection.fields.getByName('image')
    if (imageField) {
      imageField.maxSize = 20 * 1024 * 1024
    }

    const imagesField = collection.fields.getByName('images')
    if (imagesField) {
      imagesField.maxSize = 20 * 1024 * 1024
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('news')

    const imageField = collection.fields.getByName('image')
    if (imageField) {
      imageField.maxSize = 5 * 1024 * 1024
    }

    const imagesField = collection.fields.getByName('images')
    if (imagesField) {
      imagesField.maxSize = 5 * 1024 * 1024
    }

    app.save(collection)
  },
)
