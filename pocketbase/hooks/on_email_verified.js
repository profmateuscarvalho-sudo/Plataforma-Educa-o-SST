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

          // Fuso America/Sao_Paulo (UTC-3) por partes civis
          var nowVer = new Date()
          var utcVer = nowVer.getTime() + nowVer.getTimezoneOffset() * 60000
          var spVer = new Date(utcVer - 3 * 3600000)
          var fYear = spVer.getUTCFullYear() + 1
          var fMonth = spVer.getUTCMonth() + 1
          var fDay = spVer.getUTCDate()
          if (
            fMonth === 2 &&
            fDay === 29 &&
            (fYear % 4 !== 0 || (fYear % 100 === 0 && fYear % 400 !== 0))
          ) {
            fDay = 28
          }
          var fDateStr =
            fYear +
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

          $app
            .logger()
            .info(
              'Free subscription activated on email verification (no duplicate email log)',
              'userId',
              e.record.id,
              'subscriptionId',
              subscription.id,
            )
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
