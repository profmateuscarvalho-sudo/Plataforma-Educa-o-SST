routerAdd('POST', '/backend/v1/ativar-assinatura', (e) => {
  var body = e.requestInfo().body || {}
  var token = (body.token || '').trim()

  if (!token) return e.badRequestError('Token é obrigatório')

  var sanitizedToken = token.replace(/[^a-zA-Z0-9-]/g, '')
  if (!sanitizedToken) return e.badRequestError('Token inválido')

  var subscription
  try {
    subscription = $app.findFirstRecordByFilter(
      'subscriptions',
      "token = '" + sanitizedToken + "' && status = 'pending'",
    )
  } catch (err) {
    return e.json(404, { error: 'Token inválido, expirado ou já utilizado.' })
  }

  try {
    subscription.set('status', 'active')
    $app.save(subscription)
  } catch (err) {
    $app.logger().error('Failed to activate subscription', 'error', err.message)
    return e.json(500, { error: 'Erro ao ativar assinatura.' })
  }

  var userId = subscription.getString('user')
  var planId = subscription.getString('plan')
  var planName = ''

  if (planId) {
    try {
      var plan = $app.findRecordById('subscription_plans', planId)
      planName = plan.getString('name')
    } catch (_) {}
  }

  if (userId) {
    try {
      var user = $app.findRecordById('users', userId)
      var planNameLower = planName.toLowerCase()
      var tier = 'free'
      if (planNameLower.indexOf('ouro') !== -1) {
        tier = 'ouro'
      } else if (planNameLower.indexOf('prata') !== -1) {
        tier = 'prata'
      }

      if (tier !== 'free') {
        user.set('plan_tier', tier)
      }

      var baseDate = new Date()
      baseDate.setFullYear(baseDate.getFullYear() + 1)
      var month = baseDate.getMonth() + 1
      var day = baseDate.getDate()
      var dateStr =
        baseDate.getFullYear() +
        '-' +
        (month < 10 ? '0' + month : '' + month) +
        '-' +
        (day < 10 ? '0' + day : '' + day)
      user.set('contract_end_date', dateStr)
      $app.save(user)
    } catch (err) {
      $app.logger().error('Failed to update user on activation', 'error', err.message)
    }
  }

  var apiKey = $secrets.get('BREVO_API_KEY')
  if (apiKey && userId) {
    try {
      var userRec = $app.findRecordById('users', userId)
      var userEmail = userRec.getString('email')
      var userName = userRec.getString('name')

      var contactRes = $http.send({
        url: 'https://api.brevo.com/v3/contacts',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          email: userEmail,
          attributes: { NOME: userName, PLAN: planName },
          listIds: [7],
          updateEnabled: true,
        }),
        timeout: 30,
      })

      if (contactRes.statusCode < 200 || contactRes.statusCode >= 300) {
        var cBody = contactRes.body
          ? String.fromCharCode.apply(null, new Uint8Array(contactRes.body))
          : 'unknown'
        $app
          .logger()
          .error('Brevo List 7 sync failed', 'status', contactRes.statusCode, 'body', cBody)
      } else {
        $app.logger().info('Subscriber synced to Brevo List 7', 'email', userEmail)
      }
    } catch (err) {
      $app.logger().error('Failed to sync subscriber to Brevo List 7', 'error', err.message)
    }
  }

  return e.json(200, { success: true, message: 'Assinatura ativada com sucesso!', plan: planName })
})
