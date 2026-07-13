routerAdd(
  'POST',
  '/backend/v1/create_subscription',
  (e) => {
    const body = e.requestInfo().body || {}
    const authUserId = e.auth ? e.auth.id : ''

    if (!authUserId) throw new UnauthorizedError('auth required')

    var targetUserId = body.user_id || authUserId
    var planId = body.plan_id

    if (!planId) return e.badRequestError('plan_id is required')

    try {
      $app.findRecordById('subscription_plans', planId)
    } catch (_) {
      return e.badRequestError('Invalid plan_id')
    }

    var existingSub = null
    try {
      existingSub = $app.findFirstRecordByFilter('subscriptions', "user = '" + targetUserId + "'")
    } catch (_) {}

    if (existingSub) {
      existingSub.set('plan', planId)
      existingSub.set('status', 'pending')
      $app.save(existingSub)

      $app
        .logger()
        .info(
          'Subscription plan updated via create_subscription endpoint',
          'userId',
          targetUserId,
          'planId',
          planId,
          'subscriptionId',
          existingSub.id,
        )

      return e.json(200, {
        success: true,
        message: 'Subscription plan updated',
        subscription_id: existingSub.id,
        scenario: 'upgrade',
      })
    }

    var token =
      $security.randomString(8) +
      '-' +
      $security.randomString(4) +
      '-' +
      $security.randomString(4) +
      '-' +
      $security.randomString(12)

    var subsCol = $app.findCollectionByNameOrId('subscriptions')
    var subRecord = new Record(subsCol)
    subRecord.set('user', targetUserId)
    subRecord.set('status', 'pending')
    subRecord.set('plan', planId)
    subRecord.set('token', token)
    $app.save(subRecord)

    $app
      .logger()
      .info(
        'New subscription created via create_subscription endpoint',
        'userId',
        targetUserId,
        'planId',
        planId,
        'subscriptionId',
        subRecord.id,
      )

    return e.json(200, {
      success: true,
      message: 'Subscription created',
      subscription_id: subRecord.id,
      scenario: 'new',
    })
  },
  $apis.requireAuth(),
)
