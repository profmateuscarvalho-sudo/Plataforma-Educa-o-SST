migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('events')

    // Make price optional
    const priceField = col.fields.getByName('price')
    if (priceField) {
      priceField.required = false
    }

    // Add subtitle
    if (!col.fields.getByName('subtitle')) {
      col.fields.add(new TextField({ name: 'subtitle' }))
    }

    // Add partner_logos
    if (!col.fields.getByName('partner_logos')) {
      col.fields.add(
        new FileField({
          name: 'partner_logos',
          maxSelect: 20,
          mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('events')

    const priceField = col.fields.getByName('price')
    if (priceField) {
      priceField.required = true
    }

    col.fields.removeByName('subtitle')
    col.fields.removeByName('partner_logos')

    app.save(col)
  },
)
