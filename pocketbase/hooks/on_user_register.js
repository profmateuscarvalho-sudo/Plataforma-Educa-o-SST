onRecordAfterCreateSuccess((e) => {
  if (!e.record.getString('plan_tier')) {
    try {
      var userRecord = $app.findRecordById('users', e.record.id)
      userRecord.set('plan_tier', 'free')
      userRecord.set('subscription_billing', 'none')
      $app.saveNoValidate(userRecord)
    } catch (_) {}
  }

  if (e.record.getString('role') !== 'student') return e.next()

  var planId = ''
  var planLookupFailed = false
  var planErrMessage = ''

  try {
    var freePlan = $app.findFirstRecordByFilter('subscription_plans', 'price = 0')
    planId = freePlan.id

    var freePlanPrice = freePlan.getFloat('price')
    var freePlanName = freePlan.getString('name')
    $app
      .logger()
      .info(
        'Free plan identified on registration',
        'planId',
        planId,
        'planName',
        freePlanName,
        'planPrice',
        freePlanPrice,
      )
  } catch (planErr) {
    planLookupFailed = true
    planErrMessage = planErr.message
    $app.logger().error('Failed to locate Free plan during registration', 'error', planErr.message)

    try {
      var regLogsCol = $app.findCollectionByNameOrId('email_logs')
      var regLogRecord = new Record(regLogsCol)
      regLogRecord.set('recipient_email', e.record.getString('email'))
      regLogRecord.set('recipient_name', e.record.getString('name'))
      regLogRecord.set('email_type', 'activation_free')
      regLogRecord.set('sent', false)
      regLogRecord.set('brevo_synced', false)
      regLogRecord.set('brevo_list_id', 0)
      regLogRecord.set('brevo_status', 0)
      regLogRecord.set(
        'error_message',
        'Failed to locate Free plan during registration: ' + planErr.message,
      )
      regLogRecord.set('user', e.record.id)
      $app.saveNoValidate(regLogRecord)
    } catch (logErr) {
      $app.logger().error('Failed to log registration error to email_logs', 'error', logErr.message)
    }
  }

  try {
    $app.runInTransaction(function (txApp) {
      var existingSub = null
      try {
        existingSub = txApp.findFirstRecordByFilter('subscriptions', "user = '" + e.record.id + "'")
      } catch (_) {}

      if (existingSub) return

      var subsCol = txApp.findCollectionByNameOrId('subscriptions')
      var subRecord = new Record(subsCol)
      subRecord.set('user', e.record.id)
      subRecord.set('status', 'pending')
      if (planId) {
        subRecord.set('plan', planId)
      }
      txApp.save(subRecord)

      $app
        .logger()
        .info('Subscription created on registration', 'userId', e.record.id, 'planId', planId)
    })
  } catch (err) {
    $app.logger().error('Failed to create subscription on register', 'error', err.message)
  }

  return e.next()
}, 'users')
