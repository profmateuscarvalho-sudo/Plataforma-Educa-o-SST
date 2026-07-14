onRecordAfterUpdateSuccess((e) => {
  var newVerified = e.record.getBool('verified')
  var oldVerified = e.record.original().getBool('verified')

  if (newVerified && !oldVerified) {
    try {
      var userRecord = $app.findRecordById('users', e.record.id)
      if (!userRecord.getBool('email_verificado')) {
        userRecord.set('email_verificado', true)
        $app.saveNoValidate(userRecord)
        $app.logger().info('email_verificado set to true', 'userId', e.record.id)
      }
    } catch (err) {
      $app
        .logger()
        .error('Failed to set email_verificado', 'error', err.message, 'userId', e.record.id)
    }

    try {
      var subscription = null
      try {
        subscription = $app.findFirstRecordByFilter(
          'subscriptions',
          "user = '" + e.record.id + "' && status = 'pending'",
        )
      } catch (_) {}

      if (subscription) {
        var planId = subscription.getString('plan')
        var isFreePlan = false
        var planName = ''

        if (planId) {
          try {
            var plan = $app.findRecordById('subscription_plans', planId)
            planName = plan.getString('name')
            var planPrice = plan.getNum('price')
            isFreePlan = planName.toLowerCase().indexOf('free') !== -1 || planPrice === 0
          } catch (_) {}
        }

        if (isFreePlan) {
          subscription.set('status', 'active')
          $app.save(subscription)

          var userForPlan = $app.findRecordById('users', e.record.id)
          var planNameLower = planName.toLowerCase()
          var tier = 'free'
          if (planNameLower.indexOf('ouro') !== -1) {
            tier = 'ouro'
          } else if (planNameLower.indexOf('prata') !== -1) {
            tier = 'prata'
          }

          if (userForPlan.getString('plan_tier') !== tier) {
            userForPlan.set('plan_tier', tier)
          }

          var baseDate = new Date()
          baseDate.setFullYear(baseDate.getFullYear() + 1)
          var fMonth = baseDate.getMonth() + 1
          var fDay = baseDate.getDate()
          var fDateStr =
            baseDate.getFullYear() +
            '-' +
            (fMonth < 10 ? '0' + fMonth : '' + fMonth) +
            '-' +
            (fDay < 10 ? '0' + fDay : '' + fDay)
          userForPlan.set('contract_end_date', fDateStr)
          $app.saveNoValidate(userForPlan)

          $app
            .logger()
            .info(
              'Free subscription activated on email verification',
              'userId',
              e.record.id,
              'plan',
              planName,
              'tier',
              tier,
            )

          try {
            var logsCol = $app.findCollectionByNameOrId('email_logs')
            var logRecord = new Record(logsCol)
            logRecord.set('recipient_email', e.record.getString('email'))
            logRecord.set('recipient_name', e.record.getString('name') || '')
            logRecord.set('email_type', 'activation_free')
            logRecord.set('sent', true)
            logRecord.set('sent_at', new Date().toISOString())
            logRecord.set('brevo_synced', false)
            logRecord.set('brevo_list_id', 0)
            logRecord.set('brevo_status', 0)
            logRecord.set('error_message', '')
            logRecord.set('user', e.record.id)
            logRecord.set('subscription', subscription.id)
            $app.save(logRecord)
          } catch (logErr) {
            $app.logger().error('Failed to log activation on verification', 'error', logErr.message)
          }
        }
      }
    } catch (err) {
      $app
        .logger()
        .error(
          'Failed to activate subscription on email verification',
          'error',
          err.message,
          'userId',
          e.record.id,
        )
    }
  }

  return e.next()
}, 'users')
