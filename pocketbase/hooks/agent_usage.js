routerAdd(
  'GET',
  '/backend/v1/agent/usage',
  (e) => {
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')

    var user = $app.findRecordById('users', userId)
    var userRole = user.getString('role')
    var planTier = (user.getString('plan_tier') || 'free').toLowerCase()

    var limit = 10
    try {
      var limitsRecords = $app.findRecordsByFilter('agent_limits_config', '', '', 1, 0)
      if (limitsRecords.length > 0) {
        var config = limitsRecords[0]
        if (userRole === 'admin') {
          limit = 999999
        } else if (planTier === 'ouro') {
          limit = config.getInt('limit_ouro')
        } else if (planTier === 'prata') {
          limit = config.getInt('limit_prata')
        } else {
          limit = config.getInt('limit_free')
        }
      }
    } catch (_) {}

    var now = new Date()
    var monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
    var usedCount = 0
    try {
      var userMsgs = $app.findRecordsByFilter(
        'agent_messages',
        'user = "' + userId + '" && role = "user" && created >= "' + monthStart + '"',
        '',
        500,
        0,
      )
      usedCount = userMsgs.length
    } catch (_) {}

    return e.json(200, { used: usedCount, limit: limit, plan_tier: planTier })
  },
  $apis.requireAuth(),
)
