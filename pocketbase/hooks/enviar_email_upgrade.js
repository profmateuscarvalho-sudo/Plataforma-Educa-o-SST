onRecordAfterUpdateSuccess((e) => {
  var newTier = e.record.getString('plan_tier')
  var oldTier = e.record.original().getString('plan_tier')

  if (newTier === oldTier) return e.next()
  if (!newTier || newTier === 'free') return e.next()

  var apiKey = $secrets.get('BREVO_API_KEY')
  if (!apiKey) {
    $app.logger().error('BREVO_API_KEY not configured', 'hook', 'enviar_email_upgrade')
    return e.next()
  }

  var userEmail = e.record.getString('email')
  var userName = e.record.getString('name')
  var userId = e.record.id

  if (!userEmail) return e.next()

  var planLabel = 'Free'
  if (newTier === 'ouro') planLabel = 'Ouro'
  else if (newTier === 'prata') planLabel = 'Prata'

  var htmlContent =
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
    '<span style="display:inline-block;padding:8px 24px;background:#FED7AA;border-radius:50px;font-size:13px;font-weight:700;color:#9A3412;letter-spacing:1px;">UPGRADE CONFIRMADO</span>' +
    '</td></tr>' +
    '<tr><td style="padding:0 48px 48px;">' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">' +
    '<div style="width:72px;height:72px;background:#FED7AA;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;">' +
    '<span style="font-size:36px;">⬆</span>' +
    '</div>' +
    '</td></tr></table>' +
    '<h2 style="margin:0 0 24px;font-size:26px;color:#1e293b;letter-spacing:-.3px;text-align:center;">Seu plano foi atualizado!</h2>' +
    '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Olá <strong>' +
    userName +
    '</strong>,</p>' +
    '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Parabéns! Seu plano foi atualizado para o <strong>Plano ' +
    planLabel +
    '</strong>.</p>' +
    '<p style="margin:0 0 32px;font-size:16px;line-height:1.75;color:#334155;">Aproveite todos os benefícios da sua nova assinatura na plataforma Educação SST, incluindo acesso a conteúdos exclusivos e recursos avançados.</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">' +
    '<a href="https://www.educacaosst.com.br/plataforma" style="display:inline-block;padding:16px 48px;background:#facc15;color:#0f172a;font-weight:700;text-decoration:none;border-radius:10px;font-size:17px;letter-spacing:.3px;box-shadow:0 4px 14px rgba(250,204,21,.4);">Acessar Plataforma</a>' +
    '</td></tr></table>' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0;padding-top:24px;">' +
    '<p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">Em caso de dúvidas sobre os recursos do seu novo plano, nossa equipe de suporte está à disposição.</p>' +
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
        subject: 'Seu plano foi atualizado — Educação SST',
        htmlContent: htmlContent,
      }),
      timeout: 30,
    })

    if (emailRes.statusCode >= 200 && emailRes.statusCode < 300) {
      emailSent = true
      $app.logger().info('Upgrade email sent', 'email', userEmail, 'plan', planLabel)
    } else {
      var errBody = emailRes.body
        ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
        : 'unknown'
      errorMsg = errBody
      $app
        .logger()
        .error('Brevo upgrade email failed', 'status', emailRes.statusCode, 'body', errBody)
    }
  } catch (err) {
    errorMsg = err.message
    $app.logger().error('Failed to send upgrade email', 'error', err.message)
  }

  try {
    var logsCol = $app.findCollectionByNameOrId('email_logs')
    var logRecord = new Record(logsCol)
    logRecord.set('recipient_email', userEmail)
    logRecord.set('recipient_name', userName)
    logRecord.set('email_type', 'upgrade')
    logRecord.set('sent', emailSent)
    logRecord.set('sent_at', emailSent ? new Date().toISOString() : '')
    logRecord.set('brevo_synced', false)
    logRecord.set('brevo_list_id', 0)
    logRecord.set('brevo_status', 0)
    logRecord.set('error_message', errorMsg)
    logRecord.set('user', userId)
    $app.save(logRecord)
  } catch (logErr) {
    $app.logger().error('Failed to log email', 'error', logErr.message)
  }

  return e.next()
}, 'users')
