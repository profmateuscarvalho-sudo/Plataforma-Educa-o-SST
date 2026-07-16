migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('banners')
    var locations = ['Home - Topo', 'Home - Meio', 'Lateral dos Artigos', 'Rodapé']

    locations.forEach(function (location) {
      try {
        app.findFirstRecordByData('banners', 'title', 'Banner ' + location)
        return
      } catch (_) {}

      var record = new Record(col)
      record.set('title', 'Banner ' + location)
      record.set('location', location)
      record.set('destination_link', 'https://www.educacaosst.com.br/planos')
      record.set('active', true)
      app.save(record)
    })
  },
  (app) => {
    try {
      app.truncateCollection(app.findCollectionByNameOrId('banners'))
    } catch (_) {}
  },
)
