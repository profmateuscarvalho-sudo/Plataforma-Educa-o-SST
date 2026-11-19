///
/// Ajusta o campo "photo" das coleções instructors e mentors:
/// - limite de tamanho: 10 MB (default do PocketBase era 5 MB)
/// - tipos aceitos: jpg, png e webp
/// Reversível: volta ao estado anterior (sem limite/tipos).
///
migrate(
  (app) => {
    const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const MAX_SIZE = 10485760

    for (const name of ['instructors', 'mentors']) {
      const collection = app.findCollectionByNameOrId(name)
      const photo = collection.fields.find((f) => f.name === 'photo')
      if (photo) {
        photo.maxSize = MAX_SIZE
        photo.mimeTypes = IMAGE_TYPES
        app.save(collection)
      }
    }
  },
  (app) => {
    for (const name of ['instructors', 'mentors']) {
      const collection = app.findCollectionByNameOrId(name)
      const photo = collection.fields.find((f) => f.name === 'photo')
      if (photo) {
        photo.maxSize = 0
        photo.mimeTypes = []
        app.save(collection)
      }
    }
  },
)
