onRecordAfterCreateSuccess((e) => {
  var status = e.record.getString('status')
  if (status !== 'pending') return e.next()

  try {
    var existingLog = $app.findFirstRecordByFilter(
      'email_logs',
      "subscription = '" + e.record.id + "'",
    )
    if (existingLog) {
      $app
        .logger()
        .info('Email log already exists for subscription, skipping', 'subscriptionId', e.record.id)
      return e.next()
    }
  } catch (_) {}

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
  var planIdentified = false

  if (planId) {
    try {
      var plan = $app.findRecordById('subscription_plans', planId)
      planName = plan.getString('name')
      var planPrice = plan.getFloat('price')
      isFreePlan = planName.toLowerCase().indexOf('free') !== -1 || planPrice === 0
      planIdentified = true
    } catch (err) {
      planIdentified = false
    }
  }

  if (!planIdentified) {
    $app
      .logger()
      .error(
        'plano nao identificado - verificacao manual necessaria',
        'subscriptionId',
        e.record.id,
        'userId',
        userId,
        'planId',
        planId || 'null',
        'hook',
        'processar_nova_assinatura',
      )

    try {
      var failLogsCol = $app.findCollectionByNameOrId('email_logs')
      var failLogRecord = new Record(failLogsCol)
      failLogRecord.set('recipient_email', userEmail)
      failLogRecord.set('recipient_name', userName)
      failLogRecord.set('email_type', isFreePlan ? 'activation_free' : 'activation_paid')
      failLogRecord.set('sent', false)
      failLogRecord.set('error_message', 'plano não identificado - verificação manual necessária')
      failLogRecord.set('brevo_synced', false)
      failLogRecord.set('brevo_list_id', 0)
      failLogRecord.set('brevo_status', 0)
      failLogRecord.set('user', userId)
      failLogRecord.set('subscription', e.record.id)
      $app.save(failLogRecord)
    } catch (logErr) {
      $app.logger().error('Failed to log plan identification failure', 'error', logErr.message)
    }

    return e.next()
  }

  var activationLink = 'https://www.educacaosst.com.br/ativar?token=' + token
  var subject = ''
  var htmlContent = ''
  var emailType = ''

  if (isFreePlan) {
    emailType = 'activation_free'
    subject = 'Ative sua assinatura — Educação SST'
    htmlContent =
      '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
      '<body style="margin:0;padding:0;font-family:Georgia,serif;background:#0f172a;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:48px 0;">' +
      '<tr><td align="center">' +
      '<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);">' +
      '<tr><td style="padding:40px 48px 36px;text-align:center;border-top:6px solid #2E9E6D;">' +
      '<img src="COLOQUE_AQUI_URL_DA_LOGO_HOSPEDADA" alt="Educação SST" style="max-width:200px;height:auto;margin-bottom:12px;" />' +
      '<p style="margin:0;font-size:14px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Segurança e Saúde no Trabalho</p>' +
      '</td></tr>' +
      '<tr><td style="padding:0 48px 28px;text-align:center;">' +
      '<span style="display:inline-block;padding:8px 24px;background:#D1FAE5;border-radius:50px;font-size:13px;font-weight:700;color:#065F46;letter-spacing:1px;">PLANO FREE</span>' +
      '</td></tr>' +
      '<tr><td style="padding:0 48px 48px;">' +
      '<h2 style="margin:0 0 24px;font-size:26px;color:#1e293b;letter-spacing:-.3px;">Ative sua assinatura Free</h2>' +
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Olá <strong>' +
      userName +
      '</strong>,</p>' +
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Sua assinatura <strong>Free</strong> foi criada com sucesso! Para ativar sua conta e acessar a plataforma, clique no botão abaixo:</p>' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 0;">' +
      '<a href="' +
      activationLink +
      '" style="display:inline-block;padding:16px 48px;background:#facc15;color:#0f172a;font-weight:700;text-decoration:none;border-radius:10px;font-size:17px;letter-spacing:.3px;box-shadow:0 4px 14px rgba(250,204,21,.4);">Ativar meu acesso agora</a>' +
      '</td></tr></table>' +
      '<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#94a3b8;">Ou copie e cole o link abaixo no seu navegador:</p>' +
      '<p style="margin:0 0 32px;font-size:13px;line-height:1.6;color:#64748b;word-break:break-all;">' +
      activationLink +
      '</p>' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0;padding-top:24px;">' +
      '<p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">Após a ativação, você terá acesso imediato aos conteúdos disponíveis no plano Free.</p>' +
      '</td></tr></table>' +
      '</td></tr>' +
      '<tr><td style="background:#f8fafc;padding:28px 48px;text-align:center;border-top:1px solid #e2e8f0;">' +
      '<p style="margin:0;font-size:13px;color:#94a3b8;">© 2024 Educação SST — Todos os direitos reservados.</p>' +
      '</td></tr>' +
      '</table></td></tr></table></body></html>'
  } else {
    emailType = 'activation_paid'
    subject = 'Verifique seu e-mail — Educação SST'
    htmlContent =
      '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
      '<body style="margin:0;padding:0;font-family:Georgia,serif;background:#0f172a;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:48px 0;">' +
      '<tr><td align="center">' +
      '<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);">' +
      '<tr><td style="padding:40px 48px 36px;text-align:center;border-top:6px solid #E8792B;">' +
      '<img src="COLOQUE_AQUI_URL_DA_LOGO_HOSPEDADA" alt="Educação SST" style="max-width:200px;height:auto;margin-bottom:12px;" />' +
      '<p style="margin:0;font-size:14px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Segurança e Saúde no Trabalho</p>' +
      '</td></tr>' +
      '<tr><td style="padding:0 48px 28px;text-align:center;">' +
      '<span style="display:inline-block;padding:8px 24px;background:#FED7AA;border-radius:50px;font-size:13px;font-weight:700;color:#9A3412;letter-spacing:1px;">PLANO ' +
      planName +
      '</span>' +
      '</td></tr>' +
      '<tr><td style="padding:0 48px 48px;">' +
      '<h2 style="margin:0 0 24px;font-size:26px;color:#1e293b;letter-spacing:-.3px;">Verificação de E-mail — ' +
      planName +
      '</h2>' +
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Olá <strong>' +
      userName +
      '</strong>,</p>' +
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Sua assinatura foi registrada com sucesso! Para verificar seu e-mail e concluir o cadastro, clique no botão abaixo:</p>' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 0;">' +
      '<a href="' +
      activationLink +
      '" style="display:inline-block;padding:16px 48px;background:#facc15;color:#0f172a;font-weight:700;text-decoration:none;border-radius:10px;font-size:17px;letter-spacing:.3px;box-shadow:0 4px 14px rgba(250,204,21,.4);">Confirmar meu e-mail</a>' +
      '</td></tr></table>' +
      '<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#94a3b8;">Ou copie e cole o link abaixo no seu navegador:</p>' +
      '<p style="margin:0 0 32px;font-size:13px;line-height:1.6;color:#64748b;word-break:break-all;">' +
      activationLink +
      '</p>' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#FEF9C3;border:1px solid #facc15;border-radius:10px;padding:20px 24px;">' +
      '<p style="margin:0;font-size:14px;line-height:1.7;color:#713f12;"><strong>Importante:</strong> Seu acesso à plataforma será liberado após a confirmação do pagamento.</p>' +
      '</td></tr></table>' +
      '</td></tr>' +
      '<tr><td style="background:#f8fafc;padding:28px 48px;text-align:center;border-top:1px solid #e2e8f0;">' +
      '<p style="margin:0;font-size:13px;color:#94a3b8;">© 2024 Educação SST — Todos os direitos reservados.</p>' +
      '</td></tr>' +
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

  var brevoSynced = false
  var brevoStatus = 0

  try {
    var contactRes = $http.send({
      url: 'https://api.brevo.com/v3/contacts',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        email: userEmail,
        attributes: { NOME: userName },
        listIds: [7],
        updateEnabled: true,
      }),
      timeout: 30,
    })
    brevoStatus = contactRes.statusCode
    brevoSynced = contactRes.statusCode >= 200 && contactRes.statusCode < 300
    if (!brevoSynced) {
      $app
        .logger()
        .error('Brevo contact sync failed on subscription', 'status', contactRes.statusCode)
    } else {
      $app.logger().info('User synced to Brevo List 7 on subscription', 'email', userEmail)
    }
  } catch (err) {
    $app.logger().error('Failed to sync user to Brevo on subscription', 'error', err.message)
  }

  try {
    var logsCol = $app.findCollectionByNameOrId('email_logs')
    var logRecord = new Record(logsCol)
    logRecord.set('recipient_email', userEmail)
    logRecord.set('recipient_name', userName)
    logRecord.set('email_type', emailType)
    logRecord.set('sent', emailSent)
    logRecord.set('sent_at', emailSent ? new Date().toISOString() : '')
    logRecord.set('brevo_synced', brevoSynced)
    logRecord.set('brevo_list_id', 7)
    logRecord.set('brevo_status', brevoStatus)
    logRecord.set('error_message', errorMsg)
    logRecord.set('user', userId)
    logRecord.set('subscription', e.record.id)
    $app.save(logRecord)
  } catch (logErr) {
    $app.logger().error('Failed to log email', 'error', logErr.message)
  }

  return e.next()
}, 'subscriptions')
