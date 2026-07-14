onRecordAfterCreateSuccess((e) => {
  if (!e.record.getString('plan_tier')) {
    try {
      var userRecord = $app.findRecordById('users', e.record.id)
      userRecord.set('plan_tier', 'free')
      userRecord.set('subscription_billing', 'none')
      $app.saveNoValidate(userRecord)
    } catch (_) {}
  }

  if (e.record.getString('role') !== 'student') return e.next()

  try {
    var existingSub = null
    try {
      existingSub = $app.findFirstRecordByFilter('subscriptions', "user = '" + e.record.id + "'")
    } catch (_) {}

    if (!existingSub) {
      var planId = ''
      try {
        var freePlan = $app.findFirstRecordByFilter('subscription_plans', 'price = 0')
        planId = freePlan.id
        $app
          .logger()
          .info(
            'Free plan located for new user subscription',
            'planId',
            planId,
            'userId',
            e.record.id,
          )
      } catch (planErr) {
        $app
          .logger()
          .error(
            'Failed to locate Free plan (price = 0) during registration',
            'error',
            planErr.message,
          )
      }

      var subsCol = $app.findCollectionByNameOrId('subscriptions')
      var subRecord = new Record(subsCol)
      subRecord.set('user', e.record.id)
      subRecord.set('status', 'pending')
      if (planId) {
        subRecord.set('plan', planId)
      }
      $app.save(subRecord)

      $app
        .logger()
        .info('Subscription created on user registration', 'userId', e.record.id, 'planId', planId)
    }
  } catch (err) {
    $app.logger().error('Failed to create subscription on user register', 'error', err.message)
  }

  var userEmail = e.record.getString('email')
  var userName = e.record.getString('name') || ''
  var userId = e.record.id

  if (!userEmail) return e.next()

  var emailSent = false
  var errorMsg = ''

  var smtpSettings = null
  try {
    smtpSettings = $app.findFirstRecordByFilter('smtp_settings', '1 = 1')
  } catch (_) {}

  if (!smtpSettings) {
    errorMsg = 'SMTP settings not configured'
    $app
      .logger()
      .error('SMTP settings not configured, cannot send activation email', 'userId', userId)
  } else {
    var senderName = smtpSettings.getString('sender_name') || 'Educação SST'
    var senderEmail = smtpSettings.getString('sender_email') || 'noreply@educacaosst.com.br'

    var baseUrl = $secrets.get('PB_INSTANCE_URL') || 'http://127.0.0.1:8090'
    try {
      var verifyRes = $http.send({
        url: baseUrl + '/api/collections/users/request-verification',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
        timeout: 15,
      })
      if (verifyRes.statusCode === 200 || verifyRes.statusCode === 204) {
        emailSent = true
        $app
          .logger()
          .info('Activation email sent via PB verification', 'userId', userId, 'email', userEmail)
      } else {
        errorMsg = 'PB verification HTTP ' + verifyRes.statusCode
      }
    } catch (err) {
      errorMsg = err.message || 'PB verification request failed'
    }

    if (!emailSent) {
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
              sender: { name: senderName, email: senderEmail },
              to: [{ email: userEmail, name: userName }],
              subject: 'Ative sua conta - Educação SST',
              htmlContent:
                '<html><body style="font-family:sans-serif"><h2>Olá ' +
                userName +
                '</h2><p>Bem-vindo à plataforma Educação SST!</p><p>Ative sua conta na plataforma acessando o link abaixo:</p><p><a href="' +
                siteUrl +
                '/login">Acessar a plataforma</a></p><p>Se você não se cadastrou, ignore este e-mail.</p></body></html>',
            }),
            timeout: 15,
          })
          if (brevoRes.statusCode === 200 || brevoRes.statusCode === 201) {
            emailSent = true
            $app
              .logger()
              .info(
                'Activation email sent via Brevo fallback',
                'userId',
                userId,
                'email',
                userEmail,
              )
          } else {
            errorMsg = (errorMsg ? errorMsg + '; ' : '') + 'Brevo HTTP ' + brevoRes.statusCode
          }
        } else {
          errorMsg = (errorMsg ? errorMsg + '; ' : '') + 'BREVO_API_KEY not configured'
        }
      } catch (err2) {
        errorMsg = (errorMsg ? errorMsg + '; ' : '') + (err2.message || 'Brevo failed')
      }
    }
  }

  try {
    var logsCol = $app.findCollectionByNameOrId('email_logs')
    var logRecord = new Record(logsCol)
    logRecord.set('recipient_email', userEmail)
    logRecord.set('recipient_name', userName)
    logRecord.set('email_type', 'activation_free')
    logRecord.set('sent', emailSent)
    logRecord.set('sent_at', emailSent ? new Date().toISOString() : null)
    logRecord.set('brevo_synced', false)
    logRecord.set('brevo_list_id', 0)
    logRecord.set('brevo_status', 0)
    logRecord.set('error_message', emailSent ? '' : errorMsg)
    logRecord.set('user', userId)
    $app.save(logRecord)
  } catch (logErr) {
    $app.logger().error('Failed to log activation email', 'error', logErr.message)
  }

  return e.next()
}, 'users')
