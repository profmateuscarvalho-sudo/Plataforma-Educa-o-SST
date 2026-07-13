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
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;"><tr><td align="center">' +
    '<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.05);">' +
    '<tr><td style="background:#1e293b;padding:30px 40px;text-align:center;"><span style="font-size:24px;font-weight:bold;color:#facc15;">Educação SST</span></td></tr>' +
    '<tr><td style="padding:40px;">' +
    '<h1 style="margin:0 0 20px;font-size:22px;color:#1e293b;">Bem-vindo à Educação SST!</h1>' +
    '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Olá ' +
    name +
    ',</p>' +
    '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Obrigado pelo seu interesse na <strong>Educação SST</strong>! Recebemos seus dados e em breve entraremos em contato.</p>' +
    '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#475569;">Acesse nossa plataforma para explorar nossos cursos, mentorias e conteúdos exclusivos.</p>' +
    '<div style="text-align:center;margin:32px 0;"><a href="https://www.educacaosst.com.br" style="display:inline-block;padding:14px 36px;background:#facc15;color:#1e293b;font-weight:bold;text-decoration:none;border-radius:8px;font-size:16px;">Conhecer a plataforma</a></div>' +
    '</td></tr>' +
    '<tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#94a3b8;">© 2024 Educação SST. Todos os direitos reservados.</p></td></tr>' +
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
