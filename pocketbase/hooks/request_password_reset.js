routerAdd(
  'POST',
  '/backend/v1/auth/request-password-reset',
  (e) => {
    var GENERIC_OK = {
      success: true,
      message: 'Se o e-mail estiver cadastrado, você receberá as instruções de redefinição.',
    }

    var body = e.requestInfo().body || {}
    var rawEmail = body.email ? String(body.email) : ''
    var email = rawEmail.trim().toLowerCase()

    if (!email || email.indexOf('@') < 1) {
      return e.json(200, GENERIC_OK)
    }

    // ---- anti-abuso: 3 pedidos/e-mail a cada 15min + 10 por IP por hora ----
    var clientIp = ''
    try {
      clientIp = e.realIP()
    } catch (_) {
      clientIp = ''
    }
    if (!clientIp) {
      try {
        clientIp = e.remoteIP()
      } catch (_) {
        clientIp = 'unknown'
      }
    }

    var nowMs = new Date().getTime()
    var cutoff15min = new Date(nowMs - 15 * 60 * 1000).toISOString().replace('T', ' ')
    var cutoff1h = new Date(nowMs - 60 * 60 * 1000).toISOString().replace('T', ' ')

    var ipBursts = 0
    try {
      ipBursts = $app.countRecords(
        'password_reset_throttle',
        $dbx.exp('ip = {:ip} && created >= {:cutoff}', { ip: clientIp, cutoff: cutoff1h }),
      )
    } catch (_) {
      ipBursts = 0
    }
    if (ipBursts >= 10) {
      // acima do limite por IP: resposta genérica, sem enviar e-mail
      return e.json(200, GENERIC_OK)
    }

    // ---- busca o usuário (não revela existência) ----
    var user = null
    try {
      user = $app.findAuthRecordByEmail('users', email)
    } catch (_) {
      user = null
    }

    if (!user) {
      return e.json(200, GENERIC_OK)
    }

    // ---- controle por e-mail: máx. 3 pedidos a cada 15 min ----
    var throttleCol = null
    var throttle = null
    try {
      throttleCol = $app.findCollectionByNameOrId('password_reset_throttle')
      throttle = $app.findFirstRecordByFilter(
        'password_reset_throttle',
        "email = '" + email.replace(/'/g, "''") + "'",
      )
    } catch (_) {
      throttle = null
    }

    var withinWindow = false
    var currentCount = 0
    if (throttle) {
      var createdAt = throttle.getString('created')
      if (createdAt && createdAt >= cutoff15min) {
        withinWindow = true
        currentCount = throttle.getInt('requests') || 0
      }
      if (!withinWindow) {
        // janela expirada: remove o registro antigo para recriar com created novo
        try {
          $app.delete(throttle)
        } catch (_) {}
        throttle = null
      }
    }

    if (withinWindow && currentCount >= 3) {
      // acima do limite por e-mail: resposta genérica, sem enviar e-mail
      return e.json(200, GENERIC_OK)
    }

    // registra a tentativa ANTES de enviar (falha aberta não consome limite)
    try {
      if (!throttle) {
        throttle = new Record(throttleCol)
        throttle.set('email', email)
        throttle.set('requests', 1)
        throttle.set('ip', clientIp)
      } else {
        throttle.set('requests', currentCount + 1)
        throttle.set('ip', clientIp)
      }
      $app.save(throttle)
    } catch (throttleErr) {
      $app.logger().error('password_reset: failed to save throttle', 'error', throttleErr.message)
      // sem throttle registrado, segue o fluxo (não bloqueia o usuário real)
    }

    var userName = user.getString('name') || ''

    // ---- token nativo de reset do PocketBase (aceito por confirmPasswordReset) ----
    var token = ''
    try {
      token = user.newPasswordResetToken()
    } catch (tokenErr) {
      $app.logger().error('password_reset: failed to generate token', 'error', tokenErr.message)
      return e.json(200, GENERIC_OK)
    }

    var maskedToken = token.substring(0, 4) + '...' + token.substring(token.length - 4)

    // ---- e-mail via Brevo (mesmo visual dos demais e-mails transacionais) ----
    var apiKey = String($secrets.get('BREVO_API_KEY') || $os.getenv('BREVO_API_KEY') || '').trim()
    if (!apiKey) {
      $app.logger().error('password_reset: BREVO_API_KEY not configured')
      return e.json(500, { error: 'Serviço de e-mail indisponível' })
    }

    var resetLink = 'https://www.educacaosst.com.br/reset-password/' + encodeURIComponent(token)

    var htmlContent =
      '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
      '<body style="margin:0;padding:0;font-family:Georgia,serif;background:#0f172a;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:48px 0;">' +
      '<tr><td align="center">' +
      '<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);">' +
      '<tr><td style="padding:40px 48px 36px;text-align:center;border-top:6px solid #E8792B;">' +
      '<p style="margin:0;font-size:14px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Segurança e Saúde no Trabalho</p>' +
      '</td></tr>' +
      '<tr><td style="padding:0 48px 28px;text-align:center;">' +
      '<span style="display:inline-block;padding:8px 24px;background:#FED7AA;border-radius:50px;font-size:13px;font-weight:700;color:#9A3412;letter-spacing:1px;">REDEFINIÇÃO DE SENHA</span>' +
      '</td></tr>' +
      '<tr><td style="padding:0 48px 48px;">' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">' +
      '<div style="width:72px;height:72px;background:#FED7AA;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;">' +
      '<span style="font-size:36px;">🔑</span>' +
      '</div>' +
      '</td></tr></table>' +
      '<h2 style="margin:0 0 24px;font-size:26px;color:#1e293b;letter-spacing:-.3px;text-align:center;">Redefinição de senha</h2>' +
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Olá <strong>' +
      userName +
      '</strong>,</p>' +
      '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Recebemos uma solicitação para redefinir a senha da sua conta na plataforma <strong>Educação SST</strong>. Clique no botão abaixo para criar uma nova senha:</p>' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">' +
      '<a href="' +
      resetLink +
      '" style="display:inline-block;padding:16px 48px;background:#facc15;color:#0f172a;font-weight:700;text-decoration:none;border-radius:10px;font-size:17px;letter-spacing:.3px;box-shadow:0 4px 14px rgba(250,204,21,.4);">Criar nova senha</a>' +
      '</td></tr></table>' +
      '<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#94a3b8;">Ou copie e cole o link abaixo no seu navegador:</p>' +
      '<p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#64748b;word-break:break-all;">' +
      resetLink +
      '</p>' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#FEF9C3;border:1px solid #facc15;border-radius:10px;padding:20px 24px;">' +
      '<p style="margin:0;font-size:14px;line-height:1.7;color:#713f12;"><strong>Atenção:</strong> este link expira após um período curto de validade. Se não foi você quem solicitou esta redefinição, basta ignorar este e-mail — sua senha atual permanece a mesma.</p>' +
      '</td></tr></table>' +
      '</td></tr>' +
      '<tr><td style="background:#f8fafc;padding:28px 48px;text-align:center;border-top:1px solid #e2e8f0;">' +
      '<p style="margin:0;font-size:13px;color:#94a3b8;">© 2024 Educação SST — Todos os direitos reservados.</p>' +
      '</td></tr>' +
      '</table></td></tr></table></body></html>'

    var emailSent = false
    var errorMsg = ''
    var brevoStatus = 0

    try {
      var emailRes = $http.send({
        url: 'https://api.brevo.com/v3/smtp/email',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          sender: { name: 'Educação SST', email: 'assinante@educacaosst.com.br' },
          to: [{ email: email, name: userName }],
          subject: 'Redefinição de senha — Educação SST',
          htmlContent: htmlContent,
        }),
        timeout: 10,
      })

      brevoStatus = emailRes.statusCode
      if (emailRes.statusCode >= 200 && emailRes.statusCode < 300) {
        emailSent = true
        $app.logger().info('password_reset: email sent', 'email', email, 'token', maskedToken)
      } else {
        var errBody = emailRes.body
          ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
          : 'unknown'
        errorMsg = errBody
        $app
          .logger()
          .error('password_reset: Brevo failed', 'status', emailRes.statusCode, 'body', errBody)
      }
    } catch (err) {
      errorMsg = err.message
      brevoStatus = 0
      $app.logger().error('password_reset: failed to send email', 'error', err.message)
    }

    // ---- registro em email_logs (mesmo padrão dos outros hooks) ----
    try {
      var logsCol = $app.findCollectionByNameOrId('email_logs')
      var logRecord = new Record(logsCol)
      logRecord.set('recipient_email', email)
      logRecord.set('recipient_name', userName)
      logRecord.set('email_type', 'password_reset')
      logRecord.set('sent', emailSent)
      logRecord.set('sent_at', emailSent ? new Date().toISOString() : '')
      logRecord.set('brevo_synced', false)
      logRecord.set('brevo_list_id', 0)
      logRecord.set('brevo_status', brevoStatus)
      logRecord.set('error_message', errorMsg)
      logRecord.set('user', user.id)
      $app.save(logRecord)
    } catch (logErr) {
      $app.logger().error('password_reset: failed to log email', 'error', logErr.message)
    }

    if (!emailSent) {
      return e.json(500, { error: 'Não foi possível enviar o e-mail de redefinição' })
    }

    return e.json(200, GENERIC_OK)
  },
  $apis.gzip(),
)
