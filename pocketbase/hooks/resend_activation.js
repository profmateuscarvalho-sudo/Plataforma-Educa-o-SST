routerAdd(
  'POST',
  '/backend/v1/admin/resend-activation',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores')
    }

    var body = e.requestInfo().body || {}
    var userId = body.userId
    if (!userId) return e.badRequestError('userId é obrigatório')

    var user
    try {
      user = $app.findRecordById('users', userId)
    } catch (_) {
      return e.notFoundError('Usuário não encontrado')
    }

    var userEmail = user.getString('email')
    var userName = user.getString('name') || ''
    var planTier = user.getString('plan_tier') || 'free'
    var isFreePlan = planTier === 'free' || planTier === ''

    if (!userEmail) return e.badRequestError('Usuário não possui e-mail cadastrado')

    var token =
      $security.randomString(8) +
      '-' +
      $security.randomString(4) +
      '-' +
      $security.randomString(4) +
      '-' +
      $security.randomString(12)

    var subscriptionId = ''
    var planName = isFreePlan ? 'Free' : planTier === 'ouro' ? 'Ouro' : 'Prata'

    try {
      var existingSub = $app.findFirstRecordByFilter('subscriptions', "user = '" + userId + "'")
      existingSub.set('token', token)
      existingSub.set('status', 'pending')
      $app.save(existingSub)
      subscriptionId = existingSub.id
    } catch (_) {
      try {
        var subsCol = $app.findCollectionByNameOrId('subscriptions')
        var newSub = new Record(subsCol)
        newSub.set('user', userId)
        newSub.set('status', 'pending')
        newSub.set('token', token)
        $app.save(newSub)
        subscriptionId = newSub.id
      } catch (createErr) {
        $app
          .logger()
          .error(
            'Failed to create subscription for resend',
            'error',
            createErr.message,
            'userId',
            userId,
          )
        return e.json(500, {
          error: 'Falha ao criar registro de assinatura',
          details: createErr.message,
        })
      }
    }

    var apiKey = $secrets.get('BREVO_API_KEY')
    if (!apiKey) {
      $app.logger().error('BREVO_API_KEY not configured', 'hook', 'resend_activation')
      return e.json(500, { error: 'BREVO_API_KEY não configurado' })
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
        '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Reenviamos o link de ativação da sua assinatura <strong>Free</strong>. Para ativar sua conta e acessar a plataforma, clique no botão abaixo:</p>' +
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
        '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Reenviamos o link para verificação do seu e-mail e ativação da sua assinatura. Clique no botão abaixo para concluir o cadastro:</p>' +
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
            'Resend activation email sent',
            'email',
            userEmail,
            'type',
            emailType,
            'userId',
            userId,
          )
      } else {
        var errBody = emailRes.body
          ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
          : 'unknown'
        errorMsg = errBody
        $app
          .logger()
          .error(
            'Brevo resend activation failed',
            'status',
            emailRes.statusCode,
            'body',
            errBody,
            'userId',
            userId,
          )
      }
    } catch (err) {
      errorMsg = err.message
      $app
        .logger()
        .error('Failed to send resend activation email', 'error', err.message, 'userId', userId)
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
      logRecord.set('subscription', subscriptionId)
      $app.save(logRecord)
    } catch (logErr) {
      $app.logger().error('Failed to log resend activation email', 'error', logErr.message)
    }

    if (!emailSent) {
      return e.json(500, {
        error: 'Não foi possível enviar o e-mail de ativação',
        details: errorMsg,
      })
    }

    return e.json(200, { success: true, message: 'E-mail de ativação enviado para ' + userEmail })
  },
  $apis.requireAuth(),
)
