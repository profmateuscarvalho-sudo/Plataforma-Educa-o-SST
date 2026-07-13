onRecordAfterCreateSuccess((e) => {
  var status = e.record.getString('status')
  if (status !== 'pending') return e.next()

  var apiKey = $secrets.get('BREVO_API_KEY')
  if (!apiKey) {
    $app.logger().error('BREVO_API_KEY not configured', 'hook', 'processar_nova_assinatura')
    return e.next()
  }

  var token =
    $security.randomString(8) +
    '-' +
    $security.randomString(4) +
    '-' +
    $security.randomString(4) +
    '-' +
    $security.randomString(12)

  try {
    var record = $app.findRecordById('subscriptions', e.record.id)
    record.set('token', token)
    $app.save(record)
  } catch (err) {
    $app.logger().error('Failed to save subscription token', 'error', err.message)
    return e.next()
  }

  var userId = e.record.getString('user')
  var planId = e.record.getString('plan')
  if (!userId) return e.next()

  var userEmail = ''
  var userName = ''
  try {
    var user = $app.findRecordById('users', userId)
    userEmail = user.getString('email')
    userName = user.getString('name')
  } catch (err) {
    $app.logger().error('Failed to fetch user for subscription email', 'error', err.message)
    return e.next()
  }

  if (!userEmail) return e.next()

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

  var activationLink = 'https://www.educacaosst.com.br/ativar?token=' + token
  var subject = ''
  var htmlContent = ''
  var emailType = ''

  if (isFreePlan) {
    emailType = 'activation_free'
    subject = 'Ative sua assinatura — Educação SST'
    htmlContent =
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;"><tr><td align="center">' +
      '<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.05);">' +
      '<tr><td style="background:#1e293b;padding:30px 40px;text-align:center;"><span style="font-size:24px;font-weight:bold;color:#facc15;">Educação SST</span></td></tr>' +
      '<tr><td style="padding:40px;">' +
      '<h1 style="margin:0 0 20px;font-size:22px;color:#1e293b;">Ative sua assinatura Free</h1>' +
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Olá ' +
      userName +
      ',</p>' +
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Sua assinatura <strong>Free</strong> foi criada com sucesso! Para ativar sua conta e acessar a plataforma, clique no botão abaixo:</p>' +
      '<div style="text-align:center;margin:32px 0;"><a href="' +
      activationLink +
      '" style="display:inline-block;padding:14px 36px;background:#facc15;color:#1e293b;font-weight:bold;text-decoration:none;border-radius:8px;font-size:16px;">Ativar Assinatura</a></div>' +
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#94a3b8;">Ou copie e cole o link: ' +
      activationLink +
      '</p>' +
      '</td></tr>' +
      '<tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#94a3b8;">© 2024 Educação SST. Todos os direitos reservados.</p></td></tr>' +
      '</table></td></tr></table></body></html>'
  } else {
    emailType = 'activation_paid'
    subject = 'Verifique seu e-mail — Educação SST'
    htmlContent =
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;"><tr><td align="center">' +
      '<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.05);">' +
      '<tr><td style="background:#1e293b;padding:30px 40px;text-align:center;"><span style="font-size:24px;font-weight:bold;color:#facc15;">Educação SST</span></td></tr>' +
      '<tr><td style="padding:40px;">' +
      '<h1 style="margin:0 0 20px;font-size:22px;color:#1e293b;">Verificação de E-mail — ' +
      planName +
      '</h1>' +
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Olá ' +
      userName +
      ',</p>' +
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Sua assinatura do plano <strong>' +
      planName +
      '</strong> foi criada! Para verificar seu e-mail, clique no botão abaixo:</p>' +
      '<div style="text-align:center;margin:32px 0;"><a href="' +
      activationLink +
      '" style="display:inline-block;padding:14px 36px;background:#facc15;color:#1e293b;font-weight:bold;text-decoration:none;border-radius:8px;font-size:16px;">Verificar E-mail</a></div>' +
      '<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#94a3b8;">Ou copie e cole o link: ' +
      activationLink +
      '</p>' +
      '<div style="background:#fef3c7;border:1px solid #facc15;border-radius:8px;padding:16px 20px;margin:24px 0;">' +
      '<p style="margin:0;font-size:14px;line-height:1.6;color:#92400e;"><strong>Importante:</strong> Seu acesso à plataforma será liberado após a confirmação do pagamento.</p>' +
      '</div>' +
      '</td></tr>' +
      '<tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#94a3b8;">© 2024 Educação SST. Todos os direitos reservados.</p></td></tr>' +
      '</table></td></tr></table></body></html>'
  }

  var emailSent = false
  var errorMsg = ''

  try {
    var emailRes = $http.send({
      url: 'https://api.brevo.com/v3/smtp/email',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender: { name: 'Educação SST', email: 'assinante@educacaosst.com.br' },
        to: [{ email: userEmail, name: userName }],
        subject: subject,
        htmlContent: htmlContent,
      }),
      timeout: 30,
    })

    if (emailRes.statusCode >= 200 && emailRes.statusCode < 300) {
      emailSent = true
      $app
        .logger()
        .info(
          'Activation email sent',
          'email',
          userEmail,
          'type',
          emailType,
          'subscriptionId',
          e.record.id,
        )
    } else {
      var errBody = emailRes.body
        ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
        : 'unknown'
      errorMsg = errBody
      $app
        .logger()
        .error('Brevo activation email failed', 'status', emailRes.statusCode, 'body', errBody)
    }
  } catch (err) {
    errorMsg = err.message
    $app.logger().error('Failed to send activation email', 'error', err.message)
  }

  try {
    var logsCol = $app.findCollectionByNameOrId('email_logs')
    var logRecord = new Record(logsCol)
    logRecord.set('recipient_email', userEmail)
    logRecord.set('recipient_name', userName)
    logRecord.set('email_type', emailType)
    logRecord.set('sent', emailSent)
    logRecord.set('sent_at', emailSent ? new Date().toISOString() : '')
    logRecord.set('brevo_synced', false)
    logRecord.set('brevo_list_id', 0)
    logRecord.set('brevo_status', 0)
    logRecord.set('error_message', errorMsg)
    logRecord.set('user', userId)
    logRecord.set('subscription', e.record.id)
    $app.save(logRecord)
  } catch (logErr) {
    $app.logger().error('Failed to log email', 'error', logErr.message)
  }

  return e.next()
}, 'subscriptions')
