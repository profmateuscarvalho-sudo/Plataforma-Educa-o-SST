migrate(
  (app) => {
    try {
      const banner = app.findRecordById('banners', 'iw0dijlu6flz8ik')
      app.delete(banner)
    } catch (_) {}
  },
  (app) => {},
)
