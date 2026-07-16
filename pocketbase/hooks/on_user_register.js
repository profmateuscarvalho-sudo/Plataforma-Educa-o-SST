onRecordCreateRequest((e) => {
  var body = e.requestInfo().body || {}
  var planId = body.plan_id || ''

  if (!e.record.getString('plan_tier')) {
    e.record.set('plan_tier', 'free')
    e.record.set('subscription_billing', 'none')
  }

  e.next()

  var userId = e.record.id
  if (!userId) {
    try {
      var userRec = $app.findAuthRecordByEmail('users', e.record.getString('email'))
      userId = userRec.id
    } catch (_) {
      return
    }
  }

  if (e.record.getString('role') !== 'student') return

  var targetPlanId = ''
  var isPaidPlan = false

  if (planId) {
    try {
      var plan = $app.findRecordById('subscription_plans', planId)
      var planPrice = plan.getFloat('price')
      if (planPrice > 0) {
        targetPlanId = planId
        isPaidPlan = true
        $app
          .logger()
          .info(
            'Paid plan selected on registration',
            'planId',
            planId,
            'planName',
            plan.getString('name'),
            'planPrice',
            planPrice,
          )
      } else {
        targetPlanId = planId
      }
    } catch (_) {
      $app
        .logger()
        .warn('Invalid plan_id passed during registration, falling back to Free', 'planId', planId)
    }
  }

  if (!targetPlanId) {
    try {
      var freePlan = $app.findFirstRecordByFilter('subscription_plans', 'price = 0')
      targetPlanId = freePlan.id
      var freePlanPrice = freePlan.getFloat('price')
      var freePlanName = freePlan.getString('name')
      $app
        .logger()
        .info(
          'Free plan identified on registration',
          'planId',
          targetPlanId,
          'planName',
          freePlanName,
          'planPrice',
          freePlanPrice,
        )
    } catch (planErr) {
      $app
        .logger()
        .error('Failed to locate Free plan during registration', 'error', planErr.message)

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
        regLogRecord.set('user', userId)
        $app.saveNoValidate(regLogRecord)
      } catch (logErr) {
        $app
          .logger()
          .error('Failed to log registration error to email_logs', 'error', logErr.message)
      }
    }
  }

  try {
    $app.runInTransaction(function (txApp) {
      var existingSub = null
      try {
        existingSub = txApp.findFirstRecordByFilter('subscriptions', "user = '" + userId + "'")
      } catch (_) {}

      if (existingSub) {
        if (targetPlanId) {
          existingSub.set('plan', targetPlanId)
          txApp.save(existingSub)
        }
        return
      }

      var subsCol = txApp.findCollectionByNameOrId('subscriptions')
      var subRecord = new Record(subsCol)
      subRecord.set('user', userId)
      subRecord.set('status', 'pending')
      if (targetPlanId) {
        subRecord.set('plan', targetPlanId)
      }
      txApp.save(subRecord)

      $app
        .logger()
        .info(
          'Subscription created on registration',
          'userId',
          userId,
          'planId',
          targetPlanId,
          'isPaid',
          isPaidPlan,
        )
    })
  } catch (err) {
    $app.logger().error('Failed to create subscription on register', 'error', err.message)
  }
}, 'users')
