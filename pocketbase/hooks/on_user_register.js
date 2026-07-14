onRecordAfterCreateSuccess((e) => {
  if (!e.record.getString('plan_tier')) {
    try {
      const userRecord = $app.findRecordById('users', e.record.id)
      userRecord.set('plan_tier', 'free')
      userRecord.set('subscription_billing', 'none')
      $app.saveNoValidate(userRecord)
    } catch (_) {}
  }

  if (e.record.getString('role') !== 'student') return e.next()

  try {
    var existingSub = null
    try {
      existingSub = $app.findFirstRecordByFilter('subscriptions', "user = '" + e.record.id + "'")
    } catch (_) {}

    if (existingSub) return e.next()

    var planId = ''
    try {
      var freePlan = $app.findFirstRecordByFilter('subscription_plans', 'price = 0')
      planId = freePlan.id
      $app
        .logger()
        .info(
          'Free plan located for new user subscription',
          'planId',
          planId,
          'userId',
          e.record.id,
        )
    } catch (planErr) {
      $app
        .logger()
        .error(
          'Failed to locate Free plan (price = 0) during registration',
          'error',
          planErr.message,
        )
    }

    var subsCol = $app.findCollectionByNameOrId('subscriptions')
    var subRecord = new Record(subsCol)
    subRecord.set('user', e.record.id)
    subRecord.set('status', 'pending')
    if (planId) {
      subRecord.set('plan', planId)
    }
    $app.save(subRecord)

    $app
      .logger()
      .info('Subscription created on user registration', 'userId', e.record.id, 'planId', planId)
  } catch (err) {
    $app.logger().error('Failed to create subscription on user register', 'error', err.message)
  }

  return e.next()
}, 'users')
