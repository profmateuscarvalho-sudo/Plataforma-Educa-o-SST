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

  if (!userEmail) return e.next()

  var planLabel = 'Free'
  if (newTier === 'ouro') planLabel = 'Ouro'
  else if (newTier === 'prata') planLabel = 'Prata'

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
        subject: 'Seu plano foi atualizado — Educação SST',
        htmlContent:
          '<p>Olá ' +
          userName +
          ',</p>' +
          '<p>Parabéns! Seu plano foi atualizado para o <strong>Plano ' +
          planLabel +
          '</strong>.</p>' +
          '<p>Aproveite todos os benefícios da sua nova assinatura na plataforma Educação SST.</p>' +
          '<p><a href="https://www.educacaosst.com.br/plataforma" style="display:inline-block;padding:12px 32px;background:#facc15;color:#1e293b;font-weight:bold;text-decoration:none;border-radius:8px">Acessar Plataforma</a></p>',
      }),
      timeout: 30,
    })

    if (emailRes.statusCode < 200 || emailRes.statusCode >= 300) {
      var errBody = emailRes.body
        ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
        : 'unknown'
      $app
        .logger()
        .error('Brevo upgrade email failed', 'status', emailRes.statusCode, 'body', errBody)
    } else {
      $app.logger().info('Upgrade email sent', 'email', userEmail, 'plan', planLabel)
    }
  } catch (err) {
    $app.logger().error('Failed to send upgrade email', 'error', err.message)
  }

  return e.next()
}, 'users')
