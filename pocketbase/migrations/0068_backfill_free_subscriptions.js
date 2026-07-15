migrate(
  (app) => {
    var subsCol = app.findCollectionByNameOrId('subscriptions')

    var freePlanId = ''
    try {
      var freePlan = app.findFirstRecordByFilter('subscription_plans', 'price = 0')
      freePlanId = freePlan.id
    } catch (e) {
      console.log('Error finding Free plan:', e.message)
      return
    }

    var users = []
    try {
      users = app.findRecordsByFilter('_pb_users_auth_', "plan_tier = 'free'", '', 10000, 0)
    } catch (e) {
      console.log('Error fetching free-tier users for backfill:', e.message)
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

      var subRecord = new Record(subsCol)
      subRecord.set('user', userId)
      subRecord.set('status', 'active')
      subRecord.set('plan', freePlanId)
      app.saveNoValidate(subRecord)

      app
        .logger()
        .info(
          'Backfilled subscription for legacy user',
          'userId',
          userId,
          'planTier',
          'free',
          'subscriptionId',
          subRecord.id,
        )
    }
  },
  (app) => {},
)
