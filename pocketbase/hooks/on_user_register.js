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
      var plans = $app.findRecordsByFilter('subscription_plans', '1=1', 'created', 50, 0)
      for (var i = 0; i < plans.length; i++) {
        var p = plans[i]
        var pName = (p.getString('name') || '').toLowerCase()
        var pPrice = p.getNum('price')
        if (pName.indexOf('free') !== -1 || pPrice === 0) {
          planId = p.id
          break
        }
      }
    } catch (_) {}

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
