migrate(
  (app) => {
    var targetEmail = 'imersao@educacaosst.com.br'

    var userId = ''
    try {
      var user = app.findAuthRecordByEmail('_pb_users_auth_', targetEmail)
      userId = user.id
    } catch (_) {}

    if (userId) {
      var userCollections = ['subscriptions', 'payments', 'email_logs']
      for (var i = 0; i < userCollections.length; i++) {
        try {
          var records = app.findRecordsByFilter(userCollections[i], "user = '" + userId + "'")
          for (var j = 0; j < records.length; j++) {
            app.delete(records[j])
          }
        } catch (_) {}
      }
    }

    try {
      var emailLogRecords = app.findRecordsByFilter(
        'email_logs',
        "recipient_email = '" + targetEmail + "'",
      )
      for (var k = 0; k < emailLogRecords.length; k++) {
        app.delete(emailLogRecords[k])
      }
    } catch (_) {}

    try {
      var orphanSubs = app.findRecordsByFilter('subscriptions', "user = '' || user = null")
      for (var m = 0; m < orphanSubs.length; m++) {
        app.delete(orphanSubs[m])
      }
    } catch (_) {}

    app
      .logger()
      .info('Orphan data cleanup completed for email', 'email', targetEmail, 'userId', userId)
  },
  (app) => {},
)
