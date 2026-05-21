migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('events')
    const typeField = col.fields.getByName('type')
    typeField.selectValues = ['Workshop', 'Aula Online', 'Aula Presencial', 'Summit']
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('events')
    const typeField = col.fields.getByName('type')
    typeField.selectValues = ['Workshop', 'Aula Online', 'Aula Presencial']
    app.save(col)
  },
)
