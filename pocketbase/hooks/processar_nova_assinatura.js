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

  var activationLink = 'https://www.educacaosst.com.br/ativar?token=' + token

  try {
    var emailRes = $http.send({
      url: 'https://api.brevo.com/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'Educação SST', email: 'assinante@educacaosst.com.br' },
        to: [{ email: userEmail, name: userName }],
        subject: 'Ative sua assinatura — Educação SST',
        htmlContent:
          '<p>Olá ' +
          userName +
          ',</p>' +
          '<p>Sua assinatura foi criada com sucesso! Para ativar sua conta, clique no link abaixo:</p>' +
          '<p style="margin:24px 0"><a href="' +
          activationLink +
          '" style="display:inline-block;padding:12px 32px;background:#facc15;color:#1e293b;font-weight:bold;text-decoration:none;border-radius:8px">Ativar Assinatura</a></p>' +
          '<p>Ou copie e cole o link: ' +
          activationLink +
          '</p>' +
          '<p>Se você não solicitou esta assinatura, ignore este e-mail.</p>',
      }),
      timeout: 30,
    })

    if (emailRes.statusCode < 200 || emailRes.statusCode >= 300) {
      var errBody = emailRes.body
        ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
        : 'unknown'
      $app
        .logger()
        .error('Brevo activation email failed', 'status', emailRes.statusCode, 'body', errBody)
    } else {
      $app.logger().info('Activation email sent', 'email', userEmail, 'subscriptionId', e.record.id)
    }
  } catch (err) {
    $app.logger().error('Failed to send activation email', 'error', err.message)
  }

  return e.next()
}, 'subscriptions')
