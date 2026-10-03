migrate(
  (app) => {
    const eventsCol = app.findCollectionByNameOrId('access_events')
    const record = new Record(eventsCol)
    record.set('area', 'IPAG_SYNC_TRIGGER')
    record.set('event_type', 'page_view')
    record.set('user', '9e0hed4ap8lhkio')
    app.save(record)
  },
  (app) => {},
)
