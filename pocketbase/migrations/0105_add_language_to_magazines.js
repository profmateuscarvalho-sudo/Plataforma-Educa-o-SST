migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('magazines')
    if (!col.fields.getByName('language')) {
      col.fields.add(
        new SelectField({
          name: 'language',
          required: false,
          maxSelect: 1,
          values: ['pt-BR', 'es'],
        }),
      )
    }
    app.save(col)

    // Backfill todas as revistas existentes sem idioma como pt-BR
    app
      .db()
      .newQuery("UPDATE magazines SET language = 'pt-BR' WHERE language IS NULL OR language = ''")
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('magazines')
    if (col.fields.getByName('language')) {
      col.fields.removeByName('language')
    }
    app.save(col)
  },
)
