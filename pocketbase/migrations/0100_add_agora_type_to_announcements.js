migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('platform_announcements')
    const typeField = col.fields.getByName('type')
    if (typeField) {
      typeField.values = [
        'Texto Customizado',
        'Novo Curso',
        'Documentário',
        'Mentoria',
        'Aula Ao Vivo',
        'Ágora de Debates',
      ]
      typeField.maxSelect = 6
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('platform_announcements')
    const typeField = col.fields.getByName('type')
    if (typeField) {
      typeField.values = [
        'Texto Customizado',
        'Novo Curso',
        'Documentário',
        'Mentoria',
        'Aula Ao Vivo',
      ]
      typeField.maxSelect = 5
      app.save(col)
    }
  },
)
