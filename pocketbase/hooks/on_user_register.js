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

  try {
    $app.runInTransaction(function (txApp) {
      var existingSub = null
      try {
        existingSub = txApp.findFirstRecordByFilter('subscriptions', "user = '" + e.record.id + "'")
      } catch (_) {}

      if (existingSub) return

      var planId = ''
      try {
        var freePlan = txApp.findFirstRecordByFilter('subscription_plans', 'price = 0')
        planId = freePlan.id
      } catch (planErr) {
        $app
          .logger()
          .error('Failed to locate Free plan during registration', 'error', planErr.message)
      }

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
