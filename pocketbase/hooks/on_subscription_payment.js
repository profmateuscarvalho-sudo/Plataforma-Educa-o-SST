onRecordAfterUpdateSuccess((e) => {
  var newStatus = e.record.getString('status')
  var oldStatus = e.record.original().getString('status')

  if (newStatus !== 'paid' || oldStatus === 'paid') return e.next()
  if (e.record.getString('product_type') !== 'subscription') return e.next()

  var planId = e.record.getString('plan_id')
  var billingCycle = e.record.getString('billing_cycle')
  var userId = e.record.getString('user')

  if (!planId || !userId) return e.next()

  try {
    var plan = $app.findRecordById('subscription_plans', planId)
    var planName = plan.getString('name')

    var planNameLower = planName.toLowerCase()
    var tier = 'free'
    if (planNameLower.indexOf('ouro') !== -1) {
      tier = 'ouro'
    } else if (planNameLower.indexOf('prata') !== -1) {
      tier = 'prata'
    }

    var user = $app.findRecordById('users', userId)

    var baseDate = new Date()
    var currentEnd = user.getString('contract_end_date')
    if (currentEnd) {
      var existing = new Date(currentEnd)
      if (existing > baseDate) {
        baseDate = existing
      }
    }

    if (billingCycle === 'yearly') {
      baseDate.setFullYear(baseDate.getFullYear() + 1)
    } else {
      baseDate.setMonth(baseDate.getMonth() + 1)
    }

    var month = baseDate.getMonth() + 1
    var day = baseDate.getDate()
    var dateStr =
      baseDate.getFullYear() +
      '-' +
      (month < 10 ? '0' + month : '' + month) +
      '-' +
      (day < 10 ? '0' + day : '' + day)

    user.set('contract_end_date', dateStr)
    user.set('plan_tier', tier)
    user.set('subscription_billing', billingCycle || 'monthly')
    $app.save(user)

    $app
      .logger()
      .info(
        'Subscription activated',
        'userId',
        userId,
        'plan',
        planName,
        'tier',
        tier,
        'cycle',
        billingCycle,
      )
  } catch (err) {
    $app.logger().error('Subscription activation failed', 'error', err.message)
  }

  return e.next()
}, 'payments')
