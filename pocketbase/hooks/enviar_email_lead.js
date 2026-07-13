onRecordAfterCreateSuccess((e) => {
  var apiKey = $secrets.get('BREVO_API_KEY')
  if (!apiKey) {
    $app.logger().error('BREVO_API_KEY not configured', 'hook', 'enviar_email_lead')
    return e.next()
  }

  var name = e.record.getString('name')
  var email = e.record.getString('email')
  var phone = e.record.getString('phone')

  if (!email) return e.next()

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
    '<h2 style="margin:0 0 24px;font-size:26px;color:#1e293b;letter-spacing:-.3px;">Bem-vindo à Educação SST!</h2>' +
    '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Olá <strong>' +
    name +
    '</strong>,</p>' +
    '<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Obrigado pelo seu interesse na <strong>Educação SST</strong>! Recebemos seus dados e em breve entraremos em contato.</p>' +
    '<p style="margin:0 0 32px;font-size:16px;line-height:1.75;color:#334155;">Acesse nossa plataforma para explorar nossos cursos, mentorias e conteúdos exclusivos sobre Segurança e Saúde no Trabalho.</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">' +
    '<a href="https://www.educacaosst.com.br" style="display:inline-block;padding:16px 48px;background:#facc15;color:#0f172a;font-weight:700;text-decoration:none;border-radius:10px;font-size:17px;letter-spacing:.3px;box-shadow:0 4px 14px rgba(250,204,21,.4);">Conhecer a Plataforma</a>' +
    '</td></tr></table>' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0;padding-top:24px;">' +
    '<p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">Fique atento ao seu e-mail — nossa equipe entrará em contato em breve com mais informações sobre nossos planos e conteúdos.</p>' +
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
        to: [{ email: email, name: name }],
        subject: 'Bem-vindo à Educação SST!',
        htmlContent: htmlContent,
      }),
      timeout: 30,
    })

    if (emailRes.statusCode >= 200 && emailRes.statusCode < 300) {
      emailSent = true
      $app.logger().info('Lead welcome email sent', 'email', email)
    } else {
      var errBody = emailRes.body
        ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
        : 'unknown'
      errorMsg = errBody
      $app.logger().error('Brevo lead email failed', 'status', emailRes.statusCode, 'body', errBody)
    }
  } catch (err) {
    errorMsg = err.message
    $app.logger().error('Failed to send lead welcome email', 'error', err.message)
  }

  var brevoSynced = false
  var brevoStatus = 0

  try {
    var contactRes = $http.send({
      url: 'https://api.brevo.com/v3/contacts',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        email: email,
        attributes: { NOME: name, TELEFONE: phone },
        listIds: [4],
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
        .error('Brevo lead contact sync failed', 'status', contactRes.statusCode, 'body', cBody)
    } else {
      $app.logger().info('Lead synced to Brevo List 4', 'email', email)
    }
  } catch (err) {
    $app.logger().error('Failed to sync lead to Brevo', 'error', err.message)
  }

  try {
    var logsCol = $app.findCollectionByNameOrId('email_logs')
    var logRecord = new Record(logsCol)
    logRecord.set('recipient_email', email)
    logRecord.set('recipient_name', name)
    logRecord.set('email_type', 'lead')
    logRecord.set('sent', emailSent)
    logRecord.set('sent_at', emailSent ? new Date().toISOString() : '')
    logRecord.set('brevo_synced', brevoSynced)
    logRecord.set('brevo_list_id', 4)
    logRecord.set('brevo_status', brevoStatus)
    logRecord.set('error_message', errorMsg)
    $app.save(logRecord)
  } catch (logErr) {
    $app.logger().error('Failed to log email', 'error', logErr.message)
  }

  return e.next()
}, 'leads')
