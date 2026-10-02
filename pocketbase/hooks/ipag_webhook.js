routerAdd('POST', '/backend/v1/ipag-webhook', (e) => {
  const body = e.requestInfo().body || {}
  const source = body.attributes || body

  const orderId = source.order_id || ''
  if (!orderId) {
    $app.logger().warn('[ipag-webhook] Payload received without order_id')
    return e.json(200, { received: true })
  }

  const apiId = $secrets.get('IPAG_API_ID')
  const apiKey = $secrets.get('IPAG_API_KEY')

  if (!apiId || !apiKey) {
    $app.logger().error('[ipag-webhook] iPag credentials not configured', 'order_id', orderId)
    return e.json(502, {
      error: 'Verificação falhou: credenciais iPag não configuradas',
    })
  }

  let baseUrl = $secrets.get('IPAG_BASE_URL') || 'https://api.ipag.com.br'
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1)
  }

  const authString = apiId + ':' + apiKey
  let authBase64
  try {
    authBase64 = btoa(authString)
  } catch (_) {
    const bytes = []
    for (let i = 0; i < authString.length; i++) {
      bytes.push(authString.charCodeAt(i))
    }
    authBase64 = String.fromCharCode.apply(null, bytes)
  }

  var consultRes
  try {
    consultRes = $http.send({
      url: baseUrl + '/service/consult?order_id=' + orderId,
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + authBase64,
        'x-api-version': '2',
      },
      timeout: 30,
    })
  } catch (err) {
    $app
      .logger()
      .error(
        '[ipag-webhook] Consultation request failed',
        'order_id',
        orderId,
        'error',
        err.message,
      )
    return e.json(502, {
      error: 'Verificação falhou: não foi possível consultar o status da transação no iPag',
    })
  }

  if (consultRes.statusCode < 200 || consultRes.statusCode >= 300) {
    $app
      .logger()
      .error(
        '[ipag-webhook] Consultation API returned error',
        'status',
        consultRes.statusCode,
        'order_id',
        orderId,
      )
    return e.json(502, {
      error: 'Verificação falhou: o iPag retornou um erro ao consultar o status da transação',
    })
  }

  var consultData
  try {
    consultData = consultRes.json
  } catch (err) {
    $app
      .logger()
      .error(
        '[ipag-webhook] Failed to parse consultation response',
        'order_id',
        orderId,
        'error',
        err.message,
      )
    return e.json(502, {
      error: 'Verificação falhou: não foi possível processar a resposta do iPag',
    })
  }

  if (!consultData) {
    $app.logger().error('[ipag-webhook] Empty consultation response', 'order_id', orderId)
    return e.json(502, {
      error: 'Verificação falhou: o iPag retornou uma resposta vazia',
    })
  }

  var attributes = consultData.attributes || consultData
  var rawStatus = ''
  if (attributes.status && typeof attributes.status === 'object' && attributes.status.message) {
    rawStatus = attributes.status.message
  } else if (attributes.status != null) {
    rawStatus = String(attributes.status)
  }

  if (!rawStatus) {
    $app.logger().error('[ipag-webhook] No status in consultation response', 'order_id', orderId)
    return e.json(502, {
      error: 'Verificação falhou: o status da transação não foi retornado pelo iPag',
    })
  }

  var ipagId = consultData.uuid || consultData.id || source.uuid || source.id || ''

  var upper = (rawStatus || '').toUpperCase()
  var mappedStatus = 'pending'
  if (
    upper.indexOf('APPROV') !== -1 ||
    upper.indexOf('CAPTUR') !== -1 ||
    upper.indexOf('PAID') !== -1
  ) {
    mappedStatus = 'paid'
  } else if (
    upper.indexOf('DENIED') !== -1 ||
    upper.indexOf('REFUS') !== -1 ||
    upper.indexOf('FAIL') !== -1 ||
    upper.indexOf('CANCEL') !== -1
  ) {
    mappedStatus = 'failed'
  }

  try {
    var record = $app.findRecordById('payments', orderId)
    record.set('status', mappedStatus)
    if (ipagId) {
      record.set('ipag_id', ipagId)
    }
    $app.save(record)
    $app
      .logger()
      .info(
        '[ipag-webhook] Payment ' + orderId + ' verified and updated to ' + mappedStatus,
        'rawStatus',
        rawStatus,
        'ipagId',
        ipagId,
      )

    // Se o pagamento for de assinatura e o status for 'paid', assegurar atualização do usuário e subscription
    var productType = record.getString('product_type')
    var userId = record.getString('user')
    var planId = record.getString('plan_id')
    var billingCycle = record.getString('billing_cycle') || 'monthly'

    if (mappedStatus === 'paid' && (productType === 'subscription' || planId) && userId) {
      try {
        var user = $app.findRecordById('users', userId)
        var userEmail = user.getString('email')
        var userName = user.getString('name')
        var oldTier = user.getString('plan_tier')

        var planName = ''
        var tier = 'free'
        var planFound = false

        if (planId) {
          try {
            var plan = $app.findRecordById('subscription_plans', planId)
            planName = plan.getString('name')
            var planNameLower = planName.toLowerCase()
            var planPrice = plan.getFloat('price')
            if (planNameLower.indexOf('ouro') !== -1) {
              tier = 'ouro'
              planFound = true
            } else if (planNameLower.indexOf('prata') !== -1) {
              tier = 'prata'
              planFound = true
            } else if (planNameLower.indexOf('free') !== -1 || planPrice === 0) {
              tier = 'free'
              planFound = true
            } else {
              tier = 'prata'
              planFound = true
            }
          } catch (_) {}
        }

        if (tier !== 'free') {
          // Atualiza contract_end_date
          var baseDate = new Date()
          var currentEnd = user.getString('contract_end_date')
          if (currentEnd) {
            var existing = new Date(currentEnd)
            if (existing > baseDate) {
              baseDate = existing
            }
          }

          if (billingCycle === 'yearly') {
            baseDate.setFullYear(baseDate.getFullYear() + 1)
          } else {
            baseDate.setMonth(baseDate.getMonth() + 1)
          }

          var month = baseDate.getMonth() + 1
          var day = baseDate.getDate()
          var dateStr =
            baseDate.getFullYear() +
            '-' +
            (month < 10 ? '0' + month : '' + month) +
            '-' +
            (day < 10 ? '0' + day : '' + day)

          user.set('contract_end_date', dateStr)
          user.set('plan_tier', tier)
          user.set('subscription_billing', billingCycle)
          user.set('email_verificado', true)
          $app.save(user)

          // Localiza ou cria/atualiza registro em subscriptions com status='active' e plano pago
          var subscriptionId = ''
          var subscription = null
          try {
            subscription = $app.findFirstRecordByFilter(
              'subscriptions',
              "user = '" + userId + "' && status = 'pending'",
            )
          } catch (_) {
            try {
              subscription = $app.findFirstRecordByFilter(
                'subscriptions',
                "user = '" + userId + "'",
                '-created',
              )
            } catch (_) {
              subscription = null
            }
          }

          if (subscription) {
            subscription.set('status', 'active')
            if (planId) {
              subscription.set('plan', planId)
            }
            $app.save(subscription)
            subscriptionId = subscription.id
          } else {
            var subsCol = $app.findCollectionByNameOrId('subscriptions')
            var newSub = new Record(subsCol)
            newSub.set('user', userId)
            newSub.set('status', 'active')
            if (planId) {
              newSub.set('plan', planId)
            }
            $app.save(newSub)
            subscriptionId = newSub.id
          }

          // Disparar e-mail de assinatura/upgrade confirmado via Brevo e gravar log em email_logs com sent=true
          var brevoKey = $secrets.get('BREVO_API_KEY')
          if (brevoKey && userEmail) {
            var isUpgrade = oldTier && oldTier !== 'free' && oldTier !== tier
            var emailType = isUpgrade ? 'upgrade' : 'payment_confirmed'
            var planLabel =
              tier === 'ouro' ? 'Ouro' : tier === 'prata' ? 'Prata' : planName || 'Premium'
            var emailSubject = isUpgrade
              ? 'Seu plano foi atualizado — Educação SST'
              : 'Pagamento Confirmado — Educação SST'

            var headerBadge = isUpgrade ? 'UPGRADE CONFIRMADO' : 'PAGAMENTO CONFIRMADO'
            var headerColor = isUpgrade ? '#E8792B' : '#2E9E6D'
            var badgeBg = isUpgrade ? '#FED7AA' : '#D1FAE5'
            var badgeColor = isUpgrade ? '#9A3412' : '#065F46'
            var iconChar = isUpgrade ? '⬆' : '✓'
            var headingText = isUpgrade ? 'Seu plano foi atualizado!' : 'Pagamento Confirmado!'
            var messageBody = isUpgrade
              ? 'Parabéns! Seu plano foi atualizado para o <strong>Plano ' +
                planLabel +
                '</strong>. Aproveite todos os benefícios da sua nova assinatura na plataforma Educação SST.'
              : 'Seu pagamento foi confirmado com sucesso! Sua assinatura do plano <strong>' +
                (planName || 'Plano ' + planLabel) +
                '</strong> está ativa. Você já pode acessar todos os conteúdos exclusivos da plataforma Educação SST.'

            var htmlContent =
              '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
              '<body style="margin:0;padding:0;font-family:Georgia,serif;background:#0f172a;">' +
              '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:48px 0;">' +
              '<tr><td align="center">' +
              '<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);">' +
              '<tr><td style="padding:40px 48px 36px;text-align:center;border-top:6px solid ' +
              headerColor +
              ';">' +
              '<p style="margin:0;font-size:14px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Segurança e Saúde no Trabalho</p>' +
              '</td></tr>' +
              '<tr><td style="padding:0 48px 28px;text-align:center;">' +
              '<span style="display:inline-block;padding:8px 24px;background:' +
              badgeBg +
              ';border-radius:50px;font-size:13px;font-weight:700;color:' +
              badgeColor +
              ';letter-spacing:1px;">' +
              headerBadge +
              '</span>' +
              '</td></tr>' +
              '<tr><td style="padding:0 48px 48px;">' +
              '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">' +
              '<div style="width:72px;height:72px;background:' +
              badgeBg +
              ';border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;">' +
              '<span style="font-size:36px;">' +
              iconChar +
              '</span>' +
              '</div>' +
              '</td></tr></table>' +
              '<h2 style="margin:0 0 24px;font-size:26px;color:#1e293b;letter-spacing:-.3px;text-align:center;">' +
              headingText +
              '</h2>' +
              '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Olá <strong>' +
              userName +
              '</strong>,</p>' +
              '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">' +
              messageBody +
              '</p>' +
              '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">' +
              '<a href="https://www.educacaosst.com.br/plataforma" style="display:inline-block;padding:16px 48px;background:#facc15;color:#0f172a;font-weight:700;text-decoration:none;border-radius:10px;font-size:17px;letter-spacing:.3px;box-shadow:0 4px 14px rgba(250,204,21,.4);">Acessar Plataforma</a>' +
              '</td></tr></table>' +
              '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0;padding-top:24px;">' +
              '<p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">Aproveite todos os recursos disponíveis no seu plano. Em caso de dúvidas, entre em contato com nossa equipe de suporte.</p>' +
              '</td></tr></table>' +
              '</td></tr>' +
              '<tr><td style="background:#f8fafc;padding:28px 48px;text-align:center;border-top:1px solid #e2e8f0;">' +
              '<p style="margin:0;font-size:13px;color:#94a3b8;">© 2024 Educação SST — Todos os direitos reservados.</p>' +
              '</td></tr>' +
              '</table></td></tr></table></body></html>'

            var emailSent = false
            var errorMsg = ''
            try {
              var emailRes = $http.send({
                url: 'https://api.brevo.com/v3/smtp/email',
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
                body: JSON.stringify({
                  sender: { name: 'Educação SST', email: 'assinante@educacaosst.com.br' },
                  to: [{ email: userEmail, name: userName }],
                  subject: emailSubject,
                  htmlContent: htmlContent,
                }),
                timeout: 30,
              })

              if (emailRes.statusCode >= 200 && emailRes.statusCode < 300) {
                emailSent = true
                $app
                  .logger()
                  .info(
                    '[ipag-webhook] Email de assinatura/upgrade enviado via Brevo',
                    'email',
                    userEmail,
                  )
              } else {
                var errBody = emailRes.body
                  ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
                  : 'unknown'
                errorMsg = errBody
                $app
                  .logger()
                  .error(
                    '[ipag-webhook] Falha no envio do email Brevo',
                    'status',
                    emailRes.statusCode,
                    'body',
                    errBody,
                  )
              }
            } catch (mailErr) {
              errorMsg = mailErr.message
              $app
                .logger()
                .error('[ipag-webhook] Erro ao enviar email via Brevo', 'error', mailErr.message)
            }

            try {
              var logsCol = $app.findCollectionByNameOrId('email_logs')
              var logRecord = new Record(logsCol)
              logRecord.set('recipient_email', userEmail)
              logRecord.set('recipient_name', userName)
              logRecord.set('email_type', emailType)
              logRecord.set('sent', emailSent)
              logRecord.set('sent_at', emailSent ? new Date().toISOString() : '')
              logRecord.set('brevo_synced', emailSent)
              logRecord.set('brevo_list_id', 7)
              logRecord.set('brevo_status', emailSent ? 200 : 500)
              logRecord.set('error_message', errorMsg)
              logRecord.set('user', userId)
              if (subscriptionId) logRecord.set('subscription', subscriptionId)
              $app.save(logRecord)
            } catch (logErr) {
              $app
                .logger()
                .error('[ipag-webhook] Erro ao gravar email_log', 'error', logErr.message)
            }
          }
        }
      } catch (postProcErr) {
        $app
          .logger()
          .error(
            '[ipag-webhook] Erro no pós-processamento da assinatura',
            'error',
            postProcErr.message,
          )
      }
    }

    return e.json(200, { received: true, verified: true, status: mappedStatus })
  } catch (err) {
    $app
      .logger()
      .error(
        '[ipag-webhook] Payment record not found for order_id: ' + orderId,
        'order_id',
        orderId,
        'error',
        err.message,
      )
    return e.json(404, {
      error: 'payment record not found',
      order_id: orderId,
    })
  }
})
