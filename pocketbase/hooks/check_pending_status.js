routerAdd(
  'GET',
  '/backend/v1/pending-status',
  (e) => {
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')

    var subscription = null
    try {
      // Prioritize active subscription if user has one
      subscription = $app.findFirstRecordByFilter(
        'subscriptions',
        "user = '" + userId + "' && status = 'active'",
      )
    } catch (_) {
      try {
        subscription = $app.findFirstRecordByFilter(
          'subscriptions',
          "user = '" + userId + "'",
          '-created',
        )
      } catch (_) {}
    }

    // Se o usuário ainda não tiver assinatura ativa, verifica se há pagamento pendente
    // e faz uma consulta ativa à API do iPag
    var userRecord = null
    try {
      userRecord = $app.findRecordById('users', userId)
    } catch (_) {}

    var isSubActive = subscription && subscription.getString('status') === 'active'
    var isUserPaid =
      userRecord &&
      (userRecord.getString('plan_tier') === 'ouro' ||
        userRecord.getString('plan_tier') === 'prata')

    if (!isSubActive && !isUserPaid) {
      var pendingPayment = null
      try {
        pendingPayment = $app.findFirstRecordByFilter(
          'payments',
          "user = '" + userId + "' && product_type = 'subscription' && status = 'pending'",
          '-created',
        )
      } catch (_) {
        try {
          pendingPayment = $app.findFirstRecordByFilter(
            'payments',
            "user = '" + userId + "' && status = 'pending'",
            '-created',
          )
        } catch (_) {}
      }

      if (pendingPayment) {
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
              url: baseUrl + '/service/consult?order_id=' + pendingPayment.id,
              method: 'GET',
              headers: {
                Authorization: 'Basic ' + authBase64,
                'x-api-version': '2',
              },
              timeout: 10,
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
                pendingPayment.set('status', 'paid')
                if (ipagUuid) {
                  pendingPayment.set('ipag_id', ipagUuid)
                }
                $app.save(pendingPayment)

                // Atualizar assinatura
                if (subscription) {
                  subscription.set('status', 'active')
                  $app.save(subscription)
                }

                // Identificar plano
                var planId = pendingPayment.getString('plan_id')
                if (!planId && subscription) {
                  planId = subscription.getString('plan')
                }

                var planTier = 'prata'
                if (planId) {
                  try {
                    var pPlan = $app.findRecordById('subscription_plans', planId)
                    var pNameLower = pPlan.getString('name').toLowerCase()
                    if (pNameLower.indexOf('ouro') !== -1) {
                      planTier = 'ouro'
                    } else if (pNameLower.indexOf('prata') !== -1) {
                      planTier = 'prata'
                    }
                  } catch (_) {}
                }

                var billingCycle = pendingPayment.getString('billing_cycle') || 'monthly'

                if (userRecord) {
                  userRecord.set('plan_tier', planTier)
                  userRecord.set('subscription_billing', billingCycle)
                  userRecord.set('email_verificado', true)

                  var bDate = new Date()
                  var currentEndDateStr = userRecord.getString('contract_end_date')
                  if (currentEndDateStr) {
                    var existingDate = new Date(currentEndDateStr)
                    if (existingDate > bDate) {
                      bDate = existingDate
                    }
                  }

                  if (billingCycle === 'yearly') {
                    bDate.setFullYear(bDate.getFullYear() + 1)
                  } else {
                    bDate.setMonth(bDate.getMonth() + 1)
                  }

                  var bMonth = bDate.getMonth() + 1
                  var bDay = bDate.getDate()
                  var bDateStr =
                    bDate.getFullYear() +
                    '-' +
                    (bMonth < 10 ? '0' + bMonth : '' + bMonth) +
                    '-' +
                    (bDay < 10 ? '0' + bDay : '' + bDay)

                  userRecord.set('contract_end_date', bDateStr)
                  $app.save(userRecord)
                }

                $app
                  .logger()
                  .info(
                    '[check_pending_status] Pagamento e assinatura ativados após consulta iPag',
                    'userId',
                    userId,
                    'paymentId',
                    pendingPayment.id,
                  )
              }
            }
          } catch (cErr) {
            $app
              .logger()
              .warn('[check_pending_status] Erro ao consultar iPag', 'error', cErr.message)
          }
        }
      }
    }

    var emailLog = null
    try {
      var logs = $app.findRecordsByFilter('email_logs', "user = '" + userId + "'", '-created', 1, 0)
      if (logs.length > 0) emailLog = logs[0]
    } catch (_) {}

    if (!emailLog) {
      try {
        var authRecord = $app.findRecordById('users', userId)
        var userEmail = authRecord.getString('email')
        if (userEmail) {
          var logsByEmail = $app.findRecordsByFilter(
            'email_logs',
            "recipient_email = '" + userEmail + "'",
            '-created',
            1,
            0,
          )
          if (logsByEmail.length > 0) emailLog = logsByEmail[0]
        }
      } catch (_) {}
    }

    var state = 'pending_activation'

    if (emailLog) {
      var errorMessage = emailLog.getString('error_message') || ''
      if (errorMessage.indexOf('plano não identificado') !== -1) {
        state = 'manual_verification'
      }
    }

    var subData = null
    if (subscription) {
      subData = {
        id: subscription.id,
        status: subscription.getString('status'),
        token: subscription.getString('token'),
        created: subscription.getString('created'),
      }
    }

    var logData = null
    if (emailLog) {
      logData = {
        sent: emailLog.getBool('sent'),
        error_message: emailLog.getString('error_message'),
        email_type: emailLog.getString('email_type'),
        created: emailLog.getString('created'),
      }
    }

    return e.json(200, {
      state: state,
      subscription: subData,
      emailLog: logData,
    })
  },
  $apis.requireAuth(),
)
