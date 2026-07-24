migrate(
  (app) => {
    try {
      var records = app.findRecordsByFilter('agent_limits_config', '', '', 1, 0)
      if (records.length > 0) {
        var record = records[0]
        if (record.getInt('limit_ouro') === 500) return
        record.set('limit_ouro', 500)
        app.save(record)
      } else {
        var col = app.findCollectionByNameOrId('agent_limits_config')
        var newRecord = new Record(col)
        newRecord.set('limit_free', 50)
        newRecord.set('limit_prata', 50)
        newRecord.set('limit_ouro', 500)
        app.save(newRecord)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      var records = app.findRecordsByFilter('agent_limits_config', '', '', 1, 0)
      if (records.length > 0) {
        var record = records[0]
        record.set('limit_ouro', 200)
        app.save(record)
      }
    } catch (_) {}
  },
)
