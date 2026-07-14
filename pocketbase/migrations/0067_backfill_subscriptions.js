migrate(
  (app) => {
    var subsCol = app.findCollectionByNameOrId('subscriptions')

    var users = []
    try {
      users = app.findRecordsByFilter(
        '_pb_users_auth_',
        "plan_tier = 'prata' || plan_tier = 'ouro'",
        '',
        10000,
        0,
      )
    } catch (e) {
      console.log('Error fetching users for backfill:', e.message)
      return
    }

    for (var i = 0; i < users.length; i++) {
      var user = users[i]
      var userId = user.id

      var existing = false
      try {
        app.findFirstRecordByFilter('subscriptions', "user = '" + userId + "'")
        existing = true
      } catch (_) {}

      if (existing) continue

      var planTier = user.getString('plan_tier')
      var billing = user.getString('subscription_billing')
      var planName = ''

      if (planTier === 'ouro') {
        planName = billing === 'yearly' ? 'Ouro Anual' : 'Ouro Mensal'
      } else if (planTier === 'prata') {
        planName = billing === 'yearly' ? 'Prata Anual' : 'Prata Mensal'
      }

      var planId = ''
      if (planName) {
        try {
          var plan = app.findFirstRecordByFilter('subscription_plans', "name = '" + planName + "'")
          planId = plan.id
        } catch (_) {}
      }

      var subRecord = new Record(subsCol)
      subRecord.set('user', userId)
      subRecord.set('status', 'active')
      if (planId) {
        subRecord.set('plan', planId)
      }
      app.saveNoValidate(subRecord)

      app
        .logger()
        .info(
          'Backfilled subscription for legacy user',
          'userId',
          userId,
          'planTier',
          planTier,
          'subscriptionId',
          subRecord.id,
        )
    }
  },
  (app) => {},
)
