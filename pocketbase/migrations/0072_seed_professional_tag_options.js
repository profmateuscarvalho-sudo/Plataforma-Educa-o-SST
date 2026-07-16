migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('professional_tag_options')

    var tags = [
      'Estudante',
      'Técnico em Segurança',
      'Engenheiro de Segurança',
      'Enfermeiro do Trabalho',
      'Médico do Trabalho',
      'Outros',
    ]

    for (var i = 0; i < tags.length; i++) {
      var tagName = tags[i]
      try {
        app.findFirstRecordByData('professional_tag_options', 'name', tagName)
      } catch (_) {
        var record = new Record(col)
        record.set('name', tagName)
        record.set('active', true)
        app.saveNoValidate(record)
      }
    }
  },
  (app) => {
    var tags = [
      'Estudante',
      'Técnico em Segurança',
      'Engenheiro de Segurança',
      'Enfermeiro do Trabalho',
      'Médico do Trabalho',
      'Outros',
    ]
    for (var i = 0; i < tags.length; i++) {
      try {
        var record = app.findFirstRecordByData('professional_tag_options', 'name', tags[i])
        app.delete(record)
      } catch (_) {}
    }
  },
)
