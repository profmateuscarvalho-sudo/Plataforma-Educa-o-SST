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

  if (planId) {
    try {
      var plan = $app.findRecordById('subscription_plans', planId)
      planName = plan.getString('name')
      var planPrice = plan.getNum('price')
      if (planName.toLowerCase().indexOf('free') !== -1 || planPrice === 0) {
        isFreePlan = true
        planIdentified = true
      } else {
        isFreePlan = false
        planIdentified = true
      }
    } catch (err) {
      planIdentified = false
    }
  } else {
    planIdentified = false
  }

  var apiKey = $secrets.get('BREVO_API_KEY')
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
        'plano nao identificado - verificacao manual necessaria',
        'subscriptionId',
        subscription.id,
        'userId',
        userId,
        'planId',
        planId || 'null',
        'hook',
        'ativar_assinatura',
      )

    if (userEmail) {
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
        failLogRecord.set('subscription', subscription.id)
        $app.save(failLogRecord)
      } catch (logErr) {
        $app.logger().error('Failed to log plan identification failure', 'error', logErr.message)
      }
    }

    return e.json(422, {
      error: 'plano não identificado - verificação manual necessária',
    })
  }

  try {
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

          var htmlContent =
            '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
            '<body style="margin:0;padding:0;font-family:Georgia,serif;background:#0f172a;">' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:48px 0;">' +
            '<tr><td align="center">' +
            '<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);">' +
            '<tr><td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:40px 48px 36px;text-align:center;">' +
            '<h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#facc15;letter-spacing:-.5px;">Educação SST</h1>' +
            '<p style="margin:0;font-size:14px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Segurança e Saúde no Trabalho</p>' +
            '</td></tr>' +
            '<tr><td style="padding:48px;">' +
            '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">' +
            '<div style="width:72px;height:72px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;">' +
            '<span style="font-size:36px;">✓</span>' +
            '</div>' +
            '</td></tr></table>' +
            '<h2 style="margin:0 0 24px;font-size:26px;color:#1e293b;letter-spacing:-.3px;text-align:center;">Assinatura Ativada!</h2>' +
            '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Olá <strong>' +
            userName +
            '</strong>,</p>' +
            '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Sua assinatura do plano <strong>' +
            planName +
            '</strong> foi ativada com sucesso! Você já tem acesso à plataforma.</p>' +
            '<p style="margin:0 0 32px;font-size:16px;line-height:1.75;color:#334155;">Aproveite todos os conteúdos e recursos disponíveis no seu plano.</p>' +
            '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">' +
            '<a href="https://www.educacaosst.com.br/plataforma" style="display:inline-block;padding:16px 48px;background:#facc15;color:#0f172a;font-weight:700;text-decoration:none;border-radius:10px;font-size:17px;letter-spacing:.3px;box-shadow:0 4px 14px rgba(250,204,21,.4);">Acessar Plataforma</a>' +
            '</td></tr></table>' +
            '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0;padding-top:24px;">' +
            '<p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">Em caso de dúvidas, entre em contato com nossa equipe de suporte.</p>' +
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
              headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
              body: JSON.stringify({
                sender: { name: 'Educação SST', email: 'assinante@educacaosst.com.br' },
                to: [{ email: userEmail, name: userName }],
                subject: 'Assinatura Ativada — Educação SST',
                htmlContent: htmlContent,
              }),
              timeout: 30,
            })

            if (emailRes.statusCode >= 200 && emailRes.statusCode < 300) {
              emailSent = true
              $app.logger().info('Activation confirmation email sent', 'email', userEmail)
            } else {
              var errBody = emailRes.body
                ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
                : 'unknown'
              errorMsg = errBody
              $app
                .logger()
                .error(
                  'Brevo activation email failed',
                  'status',
                  emailRes.statusCode,
                  'body',
                  errBody,
                )
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
            logRecord.set('email_type', 'payment_confirmed')
            logRecord.set('sent', emailSent)
            logRecord.set('sent_at', emailSent ? new Date().toISOString() : '')
            logRecord.set('brevo_synced', brevoSynced)
            logRecord.set('brevo_list_id', 7)
            logRecord.set('brevo_status', contactRes.statusCode)
            logRecord.set('error_message', errorMsg)
            logRecord.set('user', userId)
            logRecord.set('subscription', subscription.id)
            $app.save(logRecord)
          } catch (logErr) {
            $app.logger().error('Failed to log activation email', 'error', logErr.message)
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
