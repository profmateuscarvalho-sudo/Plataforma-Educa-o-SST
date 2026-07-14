onRecordAfterCreateSuccess((e) => {
  if (!e.record.getString('plan_tier')) {
    try {
      var userRecord = $app.findRecordById('users', e.record.id)
      userRecord.set('plan_tier', 'free')
      userRecord.set('subscription_billing', 'none')
      $app.saveNoValidate(userRecord)
    } catch (_) {}
  }

  if (e.record.getString('role') !== 'student') return e.next()

  var token = ''
  var subscriptionId = ''

  try {
    var existingSub = null
    try {
      existingSub = $app.findFirstRecordByFilter('subscriptions', "user = '" + e.record.id + "'")
    } catch (_) {}

    if (!existingSub) {
      var planId = ''
      try {
        var freePlan = $app.findFirstRecordByFilter('subscription_plans', 'price = 0')
        planId = freePlan.id
      } catch (planErr) {
        $app
          .logger()
          .error('Failed to locate Free plan during registration', 'error', planErr.message)
      }

      token =
        $security.randomString(8) +
        '-' +
        $security.randomString(4) +
        '-' +
        $security.randomString(4) +
        '-' +
        $security.randomString(12)

      var subsCol = $app.findCollectionByNameOrId('subscriptions')
      var subRecord = new Record(subsCol)
      subRecord.set('user', e.record.id)
      subRecord.set('status', 'pending')
      subRecord.set('token', token)
      if (planId) {
        subRecord.set('plan', planId)
      }
      $app.save(subRecord)
      subscriptionId = subRecord.id

      $app
        .logger()
        .info('Subscription created on registration', 'userId', e.record.id, 'planId', planId)
    } else {
      subscriptionId = existingSub.id
      token = existingSub.getString('token')
    }
  } catch (err) {
    $app.logger().error('Failed to create subscription on register', 'error', err.message)
  }

  var userEmail = e.record.getString('email')
  var userName = e.record.getString('name') || ''
  var userPhone = e.record.getString('phone') || ''
  var userId = e.record.id

  if (!userEmail) return e.next()

  var emailSent = false
  var errorMsg = ''
  var brevoSynced = false
  var brevoStatus = 0

  var apiKey = $secrets.get('BREVO_API_KEY')
  if (!apiKey) {
    errorMsg = 'BREVO_API_KEY not configured'
    $app.logger().error('BREVO_API_KEY not configured', 'hook', 'on_user_register')
  } else {
    var siteUrl = $secrets.get('SITE_URL') || 'https://www.educacaosst.com.br'
    var activationLink = token ? siteUrl + '/ativar?token=' + token : siteUrl + '/login'

    var htmlContent =
      '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
      '<body style="margin:0;padding:0;font-family:Georgia,serif;background:#0f172a;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:48px 0;">' +
      '<tr><td align="center">' +
      '<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);">' +
      '<tr><td style="padding:40px 48px 36px;text-align:center;border-top:6px solid #FDBE2D;">' +
      '<p style="margin:0;font-size:14px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Segurança e Saúde no Trabalho</p>' +
      '</td></tr>' +
      '<tr><td style="padding:0 48px 28px;text-align:center;">' +
      '<span style="display:inline-block;padding:8px 24px;background:#FEF3C7;border-radius:50px;font-size:13px;font-weight:700;color:#B45309;letter-spacing:1px;">ATIVE SUA CONTA</span>' +
      '</td></tr>' +
      '<tr><td style="padding:0 48px 48px;">' +
      '<h2 style="margin:0 0 24px;font-size:26px;color:#1e293b;letter-spacing:-.3px;">Bem-vindo à Educação SST!</h2>' +
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Olá <strong>' +
      userName +
      '</strong>,</p>' +
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Seu cadastro foi realizado com sucesso! Para ativar sua conta e acessar a plataforma, clique no botão abaixo:</p>' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">' +
      '<a href="' +
      activationLink +
      '" style="display:inline-block;padding:16px 48px;background:#facc15;color:#0f172a;font-weight:700;text-decoration:none;border-radius:10px;font-size:17px;letter-spacing:.3px;box-shadow:0 4px 14px rgba(250,204,21,.4);">Ativar Minha Conta</a>' +
      '</td></tr></table>' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0;padding-top:24px;">' +
      '<p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">Se você não se cadastrou, ignore este e-mail. Este link expira em 7 dias.</p>' +
      '</td></tr></table>' +
      '</td></tr>' +
      '<tr><td style="background:#f8fafc;padding:28px 48px;text-align:center;border-top:1px solid #e2e8f0;">' +
      '<p style="margin:0;font-size:13px;color:#94a3b8;">© 2024 Educação SST — Todos os direitos reservados.</p>' +
      '</td></tr>' +
      '</table></td></tr></table></body></html>'

    try {
      var emailRes = $http.send({
        url: 'https://api.brevo.com/v3/smtp/email',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          sender: { name: 'Educação SST', email: 'assinante@educacaosst.com.br' },
          to: [{ email: userEmail, name: userName }],
          subject: 'Ative sua conta — Educação SST',
          htmlContent: htmlContent,
        }),
        timeout: 30,
      })

      if (emailRes.statusCode >= 200 && emailRes.statusCode < 300) {
        emailSent = true
        $app.logger().info('Activation email sent via Brevo', 'userId', userId, 'email', userEmail)
      } else {
        var errBody = emailRes.body
          ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
          : 'unknown'
        errorMsg = 'Brevo HTTP ' + emailRes.statusCode + ': ' + errBody
        $app
          .logger()
          .error('Brevo activation email failed', 'status', emailRes.statusCode, 'body', errBody)
      }
    } catch (err) {
      errorMsg = err.message
      $app.logger().error('Failed to send activation email', 'error', err.message)
    }

    try {
      var contactRes = $http.send({
        url: 'https://api.brevo.com/v3/contacts',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          email: userEmail,
          attributes: { NOME: userName, TELEFONE: userPhone },
          listIds: [4],
          updateEnabled: true,
        }),
        timeout: 30,
      })

      brevoStatus = contactRes.statusCode
      brevoSynced = contactRes.statusCode >= 200 && contactRes.statusCode < 300
      if (!brevoSynced) {
        $app
          .logger()
          .error('Brevo contact sync failed on registration', 'status', contactRes.statusCode)
      } else {
        $app.logger().info('User synced to Brevo List 4 on registration', 'email', userEmail)
      }
    } catch (err) {
      $app.logger().error('Failed to sync user to Brevo on registration', 'error', err.message)
    }
  }

  try {
    var logsCol = $app.findCollectionByNameOrId('email_logs')
    var logRecord = new Record(logsCol)
    logRecord.set('recipient_email', userEmail)
    logRecord.set('recipient_name', userName)
    logRecord.set('email_type', 'activation_free')
    logRecord.set('sent', emailSent)
    logRecord.set('sent_at', emailSent ? new Date().toISOString() : '')
    logRecord.set('brevo_synced', brevoSynced)
    logRecord.set('brevo_list_id', 4)
    logRecord.set('brevo_status', brevoStatus)
    logRecord.set('error_message', emailSent ? '' : errorMsg)
    logRecord.set('user', userId)
    if (subscriptionId) {
      logRecord.set('subscription', subscriptionId)
    }
    $app.save(logRecord)
  } catch (logErr) {
    $app.logger().error('Failed to log activation email', 'error', logErr.message)
  }

  return e.next()
}, 'users')
