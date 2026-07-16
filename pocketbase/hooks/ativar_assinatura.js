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
  var planIdentified = false
  var planLookupError = ''
  var fallbackErrorMsg = ''

  if (!planId) {
    $app
      .logger()
      .warn(
        'Plan field is empty on subscription, attempting free plan fallback',
        'subscriptionId',
        subscription.id,
        'userId',
        userId,
      )
    try {
      var freePlanFallback = $app.findFirstRecordByFilter('subscription_plans', 'price = 0')
      planId = freePlanFallback.id
      subscription.set('plan', planId)
      $app.save(subscription)
      $app
        .logger()
        .info(
          'Free plan assigned to subscription during activation',
          'subscriptionId',
          subscription.id,
          'planId',
          planId,
        )
    } catch (fallbackErr) {
      fallbackErrorMsg = fallbackErr.message
      $app
        .logger()
        .error(
          'Failed to find free plan for empty plan field fallback',
          'error',
          fallbackErr.message,
          'subscriptionId',
          subscription.id,
        )
    }
  }

  if (planId) {
    try {
      var plan = $app.findRecordById('subscription_plans', planId)
      planName = plan.getString('name')
      var planPrice = plan.getFloat('price')
      isFreePlan = planName.toLowerCase().indexOf('free') !== -1 || planPrice === 0
      planIdentified = true
    } catch (err) {
      planLookupError = err.message
      $app
        .logger()
        .error(
          'Plan record not found in subscription_plans collection',
          'planId',
          planId,
          'error',
          err.message,
          'subscriptionId',
          subscription.id,
        )
      planIdentified = false
    }
  }

  var userEmail = ''
  var userName = ''

  try {
    var user = $app.findRecordById('users', userId)
    userEmail = user.getString('email')
    userName = user.getString('name')
  } catch (err) {
    $app.logger().error('Failed to fetch user for activation', 'error', err.message)
    return e.json(500, { error: 'Erro ao ativar assinatura.' })
  }

  if (!planIdentified) {
    $app
      .logger()
      .error(
        'Plan not identified - manual verification required',
        'subscriptionId',
        subscription.id,
        'userId',
        userId,
        'planId',
        planId || 'empty',
        'hook',
        'ativar_assinatura',
      )

    try {
      var failLogsCol = $app.findCollectionByNameOrId('email_logs')
      var failLogRecord = new Record(failLogsCol)
      failLogRecord.set('recipient_email', userEmail)
      failLogRecord.set('recipient_name', userName)
      failLogRecord.set('email_type', 'payment_confirmed')
      failLogRecord.set('sent', false)
      var failErrorMsg = planId
        ? 'Plano não encontrado na coleção subscription_plans (ID: ' + planId + ')'
        : 'Nenhum plano associado à assinatura e plano gratuito não encontrado'
      if (planLookupError) {
        failErrorMsg += ' | Technical error: ' + planLookupError
      }
      if (fallbackErrorMsg) {
        failErrorMsg += ' | Fallback error: ' + fallbackErrorMsg
      }
      failLogRecord.set('error_message', failErrorMsg)
      failLogRecord.set('brevo_synced', false)
      failLogRecord.set('brevo_list_id', 0)
      failLogRecord.set('brevo_status', 0)
      failLogRecord.set('user', userId)
      failLogRecord.set('subscription', subscription.id)
      $app.save(failLogRecord)
    } catch (logErr) {
      $app.logger().error('Failed to log plan identification failure', 'error', logErr.message)
    }

    return e.json(422, {
      error: planId
        ? 'Plano não identificado - verificação manual necessária'
        : 'Nenhum plano associado à assinatura. Contate o suporte.',
    })
  }

  try {
    user.set('email_verificado', true)
    user.setVerified(true)

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
      user.set('plan_tier', tier)

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
      user.set('contract_end_date', fDateStr)
      $app.save(user)

      $app
        .logger()
        .info(
          'Subscription activated via token (no email sent)',
          'userId',
          userId,
          'plan',
          planName,
          'tier',
          tier,
        )

      return e.json(200, {
        success: true,
        message: 'Assinatura ativada com sucesso! Você já pode acessar a plataforma.',
        plan: planName,
        accessGranted: true,
      })
    } else {
      $app.save(user)

      $app
        .logger()
        .info('Email verified for paid plan (no email sent)', 'userId', userId, 'plan', planName)

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
