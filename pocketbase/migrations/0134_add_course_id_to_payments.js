// Adiciona o campo course_id (relation → courses, opcional) à coleção payments.
// Serve para identificar o curso comprado em compras avulsas (cartão ou Pix),
// permitindo a liberação por compra avulsa em use-student-access.hasPurchased.
// Idempotente: só adiciona o campo se ele ainda não existir.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payments')
    if (!col.fields.getByName('course_id')) {
      col.fields.add(
        new RelationField({
          name: 'course_id',
          collectionId: app.findCollectionByNameOrId('courses').id,
          cascadeDelete: false,
          minSelect: 0,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('payments')
    if (col.fields.getByName('course_id')) {
      col.fields.removeByName('course_id')
      app.save(col)
    }
  },
)
