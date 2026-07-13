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
        to: [{ email: email, name: name }],
        subject: 'Bem-vindo à Educação SST!',
        htmlContent:
          '<p>Olá ' +
          name +
          ',</p>' +
          '<p>Obrigado pelo seu interesse na <strong>Educação SST</strong>! Recebemos seus dados e em breve entraremos em contato.</p>' +
          '<p>Acesse nossa plataforma para explorar nossos cursos, mentorias e conteúdos exclusivos.</p>' +
          '<p><a href="https://www.educacaosst.com.br">Visitar plataforma</a></p>',
      }),
      timeout: 30,
    })

    if (emailRes.statusCode < 200 || emailRes.statusCode >= 300) {
      var errBody = emailRes.body
        ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
        : 'unknown'
      $app.logger().error('Brevo lead email failed', 'status', emailRes.statusCode, 'body', errBody)
    } else {
      $app.logger().info('Lead welcome email sent', 'email', email)
    }
  } catch (err) {
    $app.logger().error('Failed to send lead welcome email', 'error', err.message)
  }

  try {
    var contactRes = $http.send({
      url: 'https://api.brevo.com/v3/contacts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: email,
        attributes: { NOME: name, TELEFONE: phone },
        listIds: [4],
        updateEnabled: true,
      }),
      timeout: 30,
    })

    if (contactRes.statusCode < 200 || contactRes.statusCode >= 300) {
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

  return e.next()
}, 'leads')
