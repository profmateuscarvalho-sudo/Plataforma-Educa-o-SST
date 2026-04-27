migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('news')

    const imagesField = collection.fields.getByName('images')
    if (imagesField) {
      imagesField.maxSelect = 99
    } else {
      collection.fields.add(new FileField({ name: 'images', maxSelect: 99 }))
    }

    const imageField = collection.fields.getByName('image')
    if (imageField) {
      imageField.maxSelect = 1
    } else {
      collection.fields.add(new FileField({ name: 'image', maxSelect: 1 }))
    }

    app.save(collection)
  },
  (app) => {
    // no-op revert
  },
)
