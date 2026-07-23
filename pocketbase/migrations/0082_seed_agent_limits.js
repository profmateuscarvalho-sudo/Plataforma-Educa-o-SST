migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('agent_limits_config')

    try {
      app.findRecordsByFilter('agent_limits_config', '', '', 1, 0)
      return
    } catch (_) {}

    var record = new Record(col)
    record.set('limit_free', 10)
    record.set('limit_prata', 50)
    record.set('limit_ouro', 200)
    app.save(record)
  },
  (app) => {
    try {
      app.truncateCollection(app.findCollectionByNameOrId('agent_limits_config'))
    } catch (_) {}
  },
)
