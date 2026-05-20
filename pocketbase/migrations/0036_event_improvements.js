migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('events')

    if (!col.fields.getByName('subtitle')) {
      col.fields.add(new TextField({ name: 'subtitle' }))
    }

    if (!col.fields.getByName('speaker_photos')) {
      col.fields.add(
        new FileField({
          name: 'speaker_photos',
          maxSelect: 99,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'],
        }),
      )
    }

    const pl = col.fields.getByName('partner_logos')
    if (pl) {
      pl.maxSelect = 99
    } else {
      col.fields.add(
        new FileField({
          name: 'partner_logos',
          maxSelect: 99,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('events')
    col.fields.removeByName('speaker_photos')
    app.save(col)
  },
)
