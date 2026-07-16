migrate(
  (app) => {
    var col
    try {
      col = app.findCollectionByNameOrId('mentorships')
    } catch (_) {
      var mentorsCol
      try {
        mentorsCol = app.findCollectionByNameOrId('mentors')
      } catch (_2) {
        return
      }

      col = new Collection({
        name: 'mentorships',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'text' },
          { name: 'price', type: 'number' },
          { name: 'scheduling_link', type: 'url' },
          { name: 'mentor_name', type: 'text', required: true },
          { name: 'available_dates', type: 'text' },
          { name: 'is_free', type: 'bool' },
          { name: 'mentor_bio', type: 'editor' },
          {
            name: 'mentor_photo',
            type: 'file',
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['image/jpeg', 'image/png'],
          },
          { name: 'mentor', type: 'relation', collectionId: mentorsCol.id, maxSelect: 1 },
          { name: 'available_slots', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(col)
      return
    }

    col.listRule = ''
    col.viewRule = ''
    app.save(col)
  },
  (app) => {},
)
