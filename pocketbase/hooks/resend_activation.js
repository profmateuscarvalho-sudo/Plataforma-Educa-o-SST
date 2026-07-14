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

    var email = user.getString('email')
    var name = user.getString('name') || ''

    var baseUrl = $secrets.get('PB_INSTANCE_URL') || 'http://127.0.0.1:8090'
    var sent = false
    var errorMsg = ''

    try {
      var res = $http.send({
        url: baseUrl + '/api/collections/users/request-verification',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
        timeout: 15,
      })
      if (res.statusCode === 200 || res.statusCode === 204) {
        sent = true
      } else {
        errorMsg = 'PB verification HTTP ' + res.statusCode
      }
    } catch (err) {
      errorMsg = err.message || 'PB verification request failed'
    }

    if (!sent) {
      try {
        var brevoKey = $secrets.get('BREVO_API_KEY')
        if (brevoKey) {
          var siteUrl = $secrets.get('SITE_URL') || 'https://www.educacaosst.com.br'
          var brevoRes = $http.send({
            url: 'https://api.brevo.com/v3/smtp/email',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': brevoKey,
            },
            body: JSON.stringify({
              sender: { name: 'Educação SST', email: 'noreply@educacaosst.com.br' },
              to: [{ email: email, name: name }],
              subject: 'Ative sua conta - Educação SST',
              htmlContent:
                '<html><body style="font-family:sans-serif"><h2>Olá ' +
                name +
                '</h2><p>Ative sua conta na plataforma Educação SST acessando o link abaixo:</p><p><a href="' +
                siteUrl +
                '/login">Acessar a plataforma</a></p><p>Se você não se cadastrou, ignore este e-mail.</p></body></html>',
            }),
            timeout: 15,
          })
          if (brevoRes.statusCode === 200 || brevoRes.statusCode === 201) {
            sent = true
          } else {
            errorMsg = 'Brevo HTTP ' + brevoRes.statusCode
          }
        }
      } catch (err2) {
        errorMsg = (errorMsg ? errorMsg + '; ' : '') + (err2.message || 'Brevo failed')
      }
    }

    try {
      var logsCol = $app.findCollectionByNameOrId('email_logs')
      var logRecord = new Record(logsCol)
      logRecord.set('recipient_email', email)
      logRecord.set('recipient_name', name)
      logRecord.set('email_type', 'activation_free')
      logRecord.set('sent', sent)
      logRecord.set('sent_at', sent ? new Date().toISOString() : null)
      logRecord.set('brevo_synced', false)
      logRecord.set('brevo_list_id', 0)
      logRecord.set('brevo_status', 0)
      logRecord.set('error_message', sent ? '' : errorMsg)
      logRecord.set('user', userId)
      $app.save(logRecord)
    } catch (_) {}

    if (!sent) {
      return e.json(500, {
        error: 'Não foi possível enviar o e-mail de ativação',
        details: errorMsg,
      })
    }

    return e.json(200, { success: true, message: 'E-mail de ativação enviado para ' + email })
  },
  $apis.requireAuth(),
)
