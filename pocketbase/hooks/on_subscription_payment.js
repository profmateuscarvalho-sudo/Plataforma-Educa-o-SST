onRecordAfterUpdateSuccess((e) => {
  var newStatus = e.record.getString('status')
  var oldStatus = e.record.original().getString('status')

  if (newStatus !== 'paid' || oldStatus === 'paid') return e.next()
  if (e.record.getString('product_type') !== 'subscription') return e.next()

  var planId = e.record.getString('plan_id')
  var billingCycle = e.record.getString('billing_cycle')
  var userId = e.record.getString('user')

  if (!planId || !userId) return e.next()

  var planName = ''
  var tier = 'free'

  try {
    var plan = $app.findRecordById('subscription_plans', planId)
    planName = plan.getString('name')
    var planNameLower = planName.toLowerCase()
    if (planNameLower.indexOf('ouro') !== -1) {
      tier = 'ouro'
    } else if (planNameLower.indexOf('prata') !== -1) {
      tier = 'prata'
    }

    var user = $app.findRecordById('users', userId)
    var userEmail = user.getString('email')
    var userName = user.getString('name')

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
      var subscription = $app.findFirstRecordByFilter(
        'subscriptions',
        "user = '" + userId + "' && status = 'pending'",
      )
      subscription.set('status', 'active')
      $app.save(subscription)
      subscriptionId = subscription.id
    } catch (_) {}

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

    var apiKey = $secrets.get('BREVO_API_KEY')
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
          '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;">' +
          '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;"><tr><td align="center">' +
          '<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.05);">' +
          '<tr><td style="background:#1e293b;padding:30px 40px;text-align:center;"><span style="font-size:24px;font-weight:bold;color:#facc15;">Educação SST</span></td></tr>' +
          '<tr><td style="padding:40px;">' +
          '<h1 style="margin:0 0 20px;font-size:22px;color:#1e293b;">Pagamento Confirmado!</h1>' +
          '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Olá ' +
          userName +
          ',</p>' +
          '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Seu pagamento foi confirmado com sucesso! Sua assinatura do plano <strong>' +
          planName +
          '</strong> está ativa.</p>' +
          '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Você já pode acessar todos os conteúdos da plataforma Educação SST.</p>' +
          '<div style="text-align:center;margin:32px 0;"><a href="https://www.educacaosst.com.br/plataforma" style="display:inline-block;padding:14px 36px;background:#facc15;color:#1e293b;font-weight:bold;text-decoration:none;border-radius:8px;font-size:16px;">Acessar Plataforma</a></div>' +
          '</td></tr>' +
          '<tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#94a3b8;">© 2024 Educação SST. Todos os direitos reservados.</p></td></tr>' +
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
