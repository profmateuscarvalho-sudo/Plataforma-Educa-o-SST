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

  var userId = subscription.getString('user')
  var planId = subscription.getString('plan')
  var planName = ''
  var isFreePlan = false

  if (planId) {
    try {
      var plan = $app.findRecordById('subscription_plans', planId)
      planName = plan.getString('name')
      var planPrice = plan.getNum('price')
      if (planName.toLowerCase().indexOf('free') !== -1 || planPrice === 0) {
        isFreePlan = true
      }
    } catch (_) {}
  }

  var apiKey = $secrets.get('BREVO_API_KEY')
  var userEmail = ''
  var userName = ''

  try {
    var user = $app.findRecordById('users', userId)
    userEmail = user.getString('email')
    userName = user.getString('name')
    user.set('email_verificado', true)

    if (isFreePlan) {
      subscription.set('status', 'active')
      $app.save(subscription)

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

      if (apiKey && userEmail) {
        try {
          var contactRes = $http.send({
            url: 'https://api.brevo.com/v3/contacts',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
            body: JSON.stringify({
              email: userEmail,
              attributes: { NOME: userName, PLAN: planName },
              listIds: [7],
              updateEnabled: true,
            }),
            timeout: 30,
          })

          var brevoSynced = contactRes.statusCode >= 200 && contactRes.statusCode < 300
          if (!brevoSynced) {
            var cBody = contactRes.body
              ? String.fromCharCode.apply(null, new Uint8Array(contactRes.body))
              : 'unknown'
            $app
              .logger()
              .error('Brevo List 7 sync failed', 'status', contactRes.statusCode, 'body', cBody)
          } else {
            $app.logger().info('Subscriber synced to Brevo List 7', 'email', userEmail)
          }

          try {
            var logsCol = $app.findCollectionByNameOrId('email_logs')
            var logRecord = new Record(logsCol)
            logRecord.set('recipient_email', userEmail)
            logRecord.set('recipient_name', userName)
            logRecord.set('email_type', 'brevo_sync')
            logRecord.set('sent', false)
            logRecord.set('brevo_synced', brevoSynced)
            logRecord.set('brevo_list_id', 7)
            logRecord.set('brevo_status', contactRes.statusCode)
            logRecord.set('user', userId)
            logRecord.set('subscription', subscription.id)
            $app.save(logRecord)
          } catch (logErr) {
            $app.logger().error('Failed to log brevo sync', 'error', logErr.message)
          }
        } catch (err) {
          $app.logger().error('Failed to sync subscriber to Brevo List 7', 'error', err.message)
        }
      }

      return e.json(200, {
        success: true,
        message: 'Assinatura ativada com sucesso! Você já pode acessar a plataforma.',
        plan: planName,
        accessGranted: true,
      })
    } else {
      $app.save(user)

      return e.json(200, {
        success: true,
        message:
          'E-mail verificado com sucesso! Seu acesso será liberado após a confirmação do pagamento.',
        plan: planName,
        accessGranted: false,
      })
    }
  } catch (err) {
    $app.logger().error('Failed to activate subscription', 'error', err.message)
    return e.json(500, { error: 'Erro ao ativar assinatura.' })
  }
})
