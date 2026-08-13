migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('knowledge_entries')

    // 1. Add 'json' option to the existing `type` select field
    var typeField = col.fields.getByName('type')
    if (typeField) {
      typeField.values = ['pdf', 'image', 'link', 'free_text', 'json']
    }

    // 2. Add the new `json_data` JSON field (optional, for structured content)
    if (!col.fields.getByName('json_data')) {
      col.fields.add(new JSONField({ name: 'json_data', maxSize: 5242880 }))
    }

    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('knowledge_entries')

    var typeField = col.fields.getByName('type')
    if (typeField) {
      typeField.values = ['pdf', 'image', 'link', 'free_text']
    }

    var jsonDataField = col.fields.getByName('json_data')
    if (jsonDataField) {
      col.fields.remove(jsonDataField)
    }

    app.save(col)
  },
)
