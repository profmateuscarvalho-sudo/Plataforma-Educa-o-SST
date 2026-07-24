migrate(
  (app) => {
    try {
      var records = app.findRecordsByFilter('agent_limits_config', '', '', 1, 0)
      if (records.length > 0) {
        var record = records[0]
        record.set('limit_free', 50)
        app.save(record)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      var records = app.findRecordsByFilter('agent_limits_config', '', '', 1, 0)
      if (records.length > 0) {
        var record = records[0]
        record.set('limit_free', 10)
        app.save(record)
      }
    } catch (_) {}
  },
)
