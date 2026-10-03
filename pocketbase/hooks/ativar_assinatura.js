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

      $apis.recordAuthResponse(e, user)
      return
    } else {
      // Plano PAGO (Prata, Ouro, etc.)
      // Verifica se há pagamento pendente ou recente para consultar o gateway iPag
      var payment = null
      try {
        payment = $app.findFirstRecordByFilter(
          'payments',
          "user = '" + userId + "' && product_type = 'subscription'",
          '-created',
        )
      } catch (_) {
        try {
          payment = $app.findFirstRecordByFilter('payments', "user = '" + userId + "'", '-created')
        } catch (_) {}
      }

      var paymentApproved = false
      var billingCycle = 'monthly'
      if (payment) {
        billingCycle = payment.getString('billing_cycle') || 'monthly'
        var currentPayStatus = payment.getString('status')
        if (currentPayStatus === 'paid') {
          paymentApproved = true
        } else {
          // Consulta ativa à API do iPag
          var apiId = $secrets.get('IPAG_API_ID') || $os.getenv('IPAG_API_ID')
          var apiKey = $secrets.get('IPAG_API_KEY') || $os.getenv('IPAG_API_KEY')
          var baseUrl = (
            $secrets.get('IPAG_BASE_URL') ||
            $os.getenv('IPAG_BASE_URL') ||
            'https://api.ipag.com.br'
          ).replace(/\/+$/, '')

          if (apiId && apiKey) {
            var authString = apiId + ':' + apiKey
            var authBase64 = ''
            try {
              authBase64 = btoa(authString)
            } catch (_) {
              var bytes = []
              for (var bi = 0; bi < authString.length; bi++) {
                bytes.push(authString.charCodeAt(bi))
              }
              authBase64 = String.fromCharCode.apply(null, bytes)
            }

            try {
              var consultRes = $http.send({
                url: baseUrl + '/service/consult?order_id=' + payment.id,
                method: 'GET',
                headers: {
                  Authorization: 'Basic ' + authBase64,
                  'x-api-version': '2',
                },
                timeout: 15,
              })

              if (consultRes.statusCode >= 200 && consultRes.statusCode < 300) {
                var consultData = null
                try {
                  consultData = consultRes.json
                } catch (_) {
                  consultData = consultRes.body
                    ? String.fromCharCode.apply(null, new Uint8Array(consultRes.body))
                    : null
                }
                var attributes = consultData ? consultData.attributes || consultData : {}
                var rawStatus = ''
                if (
                  attributes.status &&
                  typeof attributes.status === 'object' &&
                  attributes.status.message
                ) {
                  rawStatus = attributes.status.message
                } else if (attributes.status != null) {
                  rawStatus = String(attributes.status)
                }

                var upper = (rawStatus || '').toUpperCase()
                var isPaid =
                  upper.indexOf('APPROV') !== -1 ||
                  upper.indexOf('CAPTUR') !== -1 ||
                  upper.indexOf('PAID') !== -1

                var ipagUuid =
                  (consultData && (consultData.uuid || consultData.id)) ||
                  attributes.uuid ||
                  attributes.id ||
                  ''

                if (isPaid) {
                  paymentApproved = true
                  payment.set('status', 'paid')
                  if (ipagUuid) {
                    payment.set('ipag_id', ipagUuid)
                  }
                  $app.save(payment)
                  $app
                    .logger()
                    .info(
                      '[ativar_assinatura] Pagamento ' +
                        payment.id +
                        ' confirmado via consulta iPag',
                      'userId',
                      userId,
                      'rawStatus',
                      rawStatus,
                    )
                }
              }
            } catch (consultErr) {
              $app
                .logger()
                .warn('[ativar_assinatura] Falha ao consultar iPag', 'error', consultErr.message)
            }
          }
        }
      }

      if (paymentApproved) {
        // Atualiza subscription para 'active'
        subscription.set('status', 'active')
        $app.save(subscription)

        // Deriva tier a partir de planName
        var paidNameLower = planName.toLowerCase()
        var paidTier = 'prata'
        if (paidNameLower.indexOf('ouro') !== -1) {
          paidTier = 'ouro'
        } else if (paidNameLower.indexOf('prata') !== -1) {
          paidTier = 'prata'
        }

        user.set('plan_tier', paidTier)
        user.set('subscription_billing', billingCycle)

        // Calcula contract_end_date
        var paidBaseDate = new Date()
        var currentEnd = user.getString('contract_end_date')
        if (currentEnd) {
          var existing = new Date(currentEnd)
          if (existing > paidBaseDate) {
            paidBaseDate = existing
          }
        }

        if (billingCycle === 'yearly') {
          paidBaseDate.setFullYear(paidBaseDate.getFullYear() + 1)
        } else {
          paidBaseDate.setMonth(paidBaseDate.getMonth() + 1)
        }

        var pMonth = paidBaseDate.getMonth() + 1
        var pDay = paidBaseDate.getDate()
        var pDateStr =
          paidBaseDate.getFullYear() +
          '-' +
          (pMonth < 10 ? '0' + pMonth : '' + pMonth) +
          '-' +
          (pDay < 10 ? '0' + pDay : '' + pDay)

        user.set('contract_end_date', pDateStr)
        $app.save(user)

        $app
          .logger()
          .info(
            'Paid subscription activated successfully upon email activation',
            'userId',
            userId,
            'plan',
            planName,
            'tier',
            paidTier,
            'contract_end_date',
            pDateStr,
          )

        $apis.recordAuthResponse(e, user)
        return
      }

      // Pagamento ainda não confirmado ou pendente no iPag
      $app.save(user)

      $app
        .logger()
        .info(
          'Email verified for paid plan, payment still awaiting confirmation',
          'userId',
          userId,
          'plan',
          planName,
        )

      $apis.recordAuthResponse(e, user)
      return
    }
  } catch (err) {
    $app.logger().error('Failed to activate subscription', 'error', err.message)
    return e.json(500, { error: 'Erro ao ativar assinatura.' })
  }
})
