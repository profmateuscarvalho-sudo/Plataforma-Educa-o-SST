routerAdd(
  'GET',
  '/backend/v1/pending-status',
  (e) => {
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')

    var subscription = null
    try {
      subscription = $app.findFirstRecordByFilter('subscriptions', "user = '" + userId + "'")
    } catch (_) {}

    var emailLog = null
    try {
      var logs = $app.findRecordsByFilter('email_logs', "user = '" + userId + "'", '-created', 1, 0)
      if (logs.length > 0) emailLog = logs[0]
    } catch (_) {}

    if (!emailLog) {
      try {
        var authRecord = $app.findRecordById('users', userId)
        var userEmail = authRecord.getString('email')
        if (userEmail) {
          var logsByEmail = $app.findRecordsByFilter(
            'email_logs',
            "recipient_email = '" + userEmail + "'",
            '-created',
            1,
            0,
          )
          if (logsByEmail.length > 0) emailLog = logsByEmail[0]
        }
      } catch (_) {}
    }

    var state = 'pending_activation'

    if (emailLog) {
      var errorMessage = emailLog.getString('error_message') || ''
      if (errorMessage.indexOf('plano não identificado') !== -1) {
        state = 'manual_verification'
      }
    }

    var subData = null
    if (subscription) {
      subData = {
        id: subscription.id,
        status: subscription.getString('status'),
        token: subscription.getString('token'),
        created: subscription.getString('created'),
      }
    }

    var logData = null
    if (emailLog) {
      logData = {
        sent: emailLog.getBool('sent'),
        error_message: emailLog.getString('error_message'),
        email_type: emailLog.getString('email_type'),
        created: emailLog.getString('created'),
      }
    }

    return e.json(200, {
      state: state,
      subscription: subData,
      emailLog: logData,
    })
  },
  $apis.requireAuth(),
)
