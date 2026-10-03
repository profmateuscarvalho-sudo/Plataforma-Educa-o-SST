onRecordAfterUpdateSuccess((e) => {
  var newStatus = e.record.getString('status')
  var oldStatus = e.record.original().getString('status')

  if (newStatus !== 'paid' || oldStatus === 'paid') return e.next()
  if (e.record.getString('product_type') !== 'subscription') return e.next()

  var planId = e.record.getString('plan_id')
  var billingCycle = e.record.getString('billing_cycle')
  var userId = e.record.getString('user')

  if (!userId) return e.next()

  var userEmail = ''
  var userName = ''

  try {
    var user = $app.findRecordById('users', userId)
    userEmail = user.getString('email')
    userName = user.getString('name')
  } catch (err) {
    $app.logger().error('Failed to fetch user for payment email', 'error', err.message)
    return e.next()
  }

  if (!userEmail) return e.next()

  var planName = ''
  var tier = 'free'
  var planIdentified = false

  if (planId) {
    try {
      var plan = $app.findRecordById('subscription_plans', planId)
      planName = plan.getString('name')
      var planNameLower = planName.toLowerCase()
      var planPrice = plan.getFloat('price')
      if (planNameLower.indexOf('ouro') !== -1) {
        tier = 'ouro'
        planIdentified = true
      } else if (planNameLower.indexOf('prata') !== -1) {
        tier = 'prata'
        planIdentified = true
      } else if (planNameLower.indexOf('free') !== -1 || planPrice === 0) {
        tier = 'free'
        planIdentified = true
      } else {
        planIdentified = true
      }
    } catch (err) {
      planIdentified = false
    }
  }

  if (!planIdentified) {
    $app
      .logger()
      .error(
        'plano nao identificado - verificacao manual necessaria',
        'paymentId',
        e.record.id,
        'userId',
        userId,
        'planId',
        planId || 'null',
        'hook',
        'on_subscription_payment',
      )

    try {
      var failLogsCol = $app.findCollectionByNameOrId('email_logs')
      var failLogRecord = new Record(failLogsCol)
      failLogRecord.set('recipient_email', userEmail)
      failLogRecord.set('recipient_name', userName)
      failLogRecord.set('email_type', 'payment_confirmed')
      failLogRecord.set('sent', false)
      failLogRecord.set('error_message', 'plano não identificado - verificação manual necessária')
      failLogRecord.set('brevo_synced', false)
      failLogRecord.set('brevo_list_id', 0)
      failLogRecord.set('brevo_status', 0)
      failLogRecord.set('user', userId)
      $app.save(failLogRecord)
    } catch (logErr) {
      $app.logger().error('Failed to log plan identification failure', 'error', logErr.message)
    }

    return e.next()
  }

  if (tier === 'free') {
    $app
      .logger()
      .info(
        'Free plan detected — skipping payment confirmed email and Brevo sync',
        'userId',
        userId,
        'planId',
        planId,
        'hook',
        'on_subscription_payment',
      )
    return e.next()
  }

  var apiKey = $secrets.get('BREVO_API_KEY')

  try {
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
    user.set('subscription_billing', billingCycle || 'monthly')
    user.set('email_verificado', true)
    $app.save(user)
    var subscriptionId = ''
    try {
      // Busca assinatura pendente ou qualquer assinatura existente do usuário (permite upgrades de quem já tem assinatura)
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
        // Se não existir nenhuma, cria novo registro em subscriptions
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
    } catch (subErr) {
      $app
        .logger()
        .error('Failed to locate or create/update active subscription', 'error', subErr.message)
    }

    $app
      .logger()
      .info(
        'Subscription activated',
        'userId',
        userId,
        'plan',
        planName,
        'tier',
        tier,
        'cycle',
        billingCycle,
      )

    var brevoSynced = false
    var brevoStatus = 0

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

        brevoStatus = contactRes.statusCode
        brevoSynced = contactRes.statusCode >= 200 && contactRes.statusCode < 300
        if (!brevoSynced) {
          var cBody = contactRes.body
            ? String.fromCharCode.apply(null, new Uint8Array(contactRes.body))
            : 'unknown'
          $app
            .logger()
            .error(
              'Brevo List 7 sync failed on payment',
              'status',
              contactRes.statusCode,
              'body',
              cBody,
            )
        } else {
          $app.logger().info('Subscriber synced to Brevo List 7 on payment', 'email', userEmail)
        }
      } catch (err) {
        $app.logger().error('Failed to sync subscriber to Brevo List 7', 'error', err.message)
      }

      var emailSent = false
      var errorMsg = ''

      try {
        var htmlContent =
          '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
          '<body style="margin:0;padding:0;font-family:Georgia,serif;background:#0f172a;">' +
          '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:48px 0;">' +
          '<tr><td align="center">' +
          '<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);">' +
          '<tr><td style="padding:40px 48px 36px;text-align:center;border-top:6px solid #2E9E6D;">' +
          '<p style="margin:0;font-size:14px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Segurança e Saúde no Trabalho</p>' +
          '</td></tr>' +
          '<tr><td style="padding:0 48px 28px;text-align:center;">' +
          '<span style="display:inline-block;padding:8px 24px;background:#D1FAE5;border-radius:50px;font-size:13px;font-weight:700;color:#065F46;letter-spacing:1px;">PAGAMENTO CONFIRMADO</span>' +
          '</td></tr>' +
          '<tr><td style="padding:0 48px 48px;">' +
          '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">' +
          '<div style="width:72px;height:72px;background:#D1FAE5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;">' +
          '<span style="font-size:36px;">✓</span>' +
          '</div>' +
          '</td></tr></table>' +
          '<h2 style="margin:0 0 24px;font-size:26px;color:#1e293b;letter-spacing:-.3px;text-align:center;">Pagamento Confirmado!</h2>' +
          '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Olá <strong>' +
          userName +
          '</strong>,</p>' +
          '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Seu pagamento foi confirmado com sucesso! Sua assinatura do plano <strong>' +
          planName +
          '</strong> está ativa.</p>' +
          '<p style="margin:0 0 32px;font-size:16px;line-height:1.75;color:#334155;">Você já pode acessar todos os conteúdos exclusivos da plataforma Educação SST.</p>' +
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

        var emailRes = $http.send({
          url: 'https://api.brevo.com/v3/smtp/email',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
          body: JSON.stringify({
            sender: { name: 'Educação SST', email: 'assinante@educacaosst.com.br' },
            to: [{ email: userEmail, name: userName }],
            subject: 'Pagamento Confirmado — Educação SST',
            htmlContent: htmlContent,
          }),
          timeout: 30,
        })

        if (emailRes.statusCode >= 200 && emailRes.statusCode < 300) {
          emailSent = true
          $app.logger().info('Payment confirmed email sent', 'email', userEmail)
        } else {
          var errBody = emailRes.body
            ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
            : 'unknown'
          errorMsg = errBody
          $app
            .logger()
            .error(
              'Brevo payment confirmed email failed',
              'status',
              emailRes.statusCode,
              'body',
              errBody,
            )
        }
      } catch (err) {
        errorMsg = err.message
        $app.logger().error('Failed to send payment confirmed email', 'error', err.message)
      }

      try {
        var logsCol = $app.findCollectionByNameOrId('email_logs')
        var logRecord = new Record(logsCol)
        logRecord.set('recipient_email', userEmail)
        logRecord.set('recipient_name', userName)
        logRecord.set('email_type', 'payment_confirmed')
        logRecord.set('sent', emailSent)
        logRecord.set('sent_at', emailSent ? new Date().toISOString() : '')
        logRecord.set('brevo_synced', brevoSynced)
        logRecord.set('brevo_list_id', 7)
        logRecord.set('brevo_status', brevoStatus)
        logRecord.set('error_message', errorMsg)
        logRecord.set('user', userId)
        if (subscriptionId) logRecord.set('subscription', subscriptionId)
        $app.save(logRecord)
      } catch (logErr) {
        $app.logger().error('Failed to log payment email', 'error', logErr.message)
      }
    }
  } catch (err) {
    $app.logger().error('Subscription activation failed', 'error', err.message)
  }

  return e.next()
}, 'payments')
