migrate(
  (app) => {
    try {
      var record = app.findFirstRecordByData('subscription_plans', 'name', 'Free')
      record.set('is_coming_soon', false)
      app.saveNoValidate(record)
    } catch (_) {}
  },
  (app) => {},
)
