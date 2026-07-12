routerAdd(
  'POST',
  '/backend/v1/leads/send-email',
  (e) => {
    const body = e.requestInfo().body || {}
    const subject = body.subject
    const content = body.content

    if (!subject || !content) {
      throw new BadRequestError('Assunto e conteúdo são obrigatórios')
    }

    let smtp
    try {
      if (e.auth?.getString('role') !== 'admin') {
        throw new ForbiddenError('Apenas administradores podem enviar campanhas.')
      }
      smtp = $app.findFirstRecordByFilter('smtp_settings', '1=1')
    } catch (_) {
      throw new BadRequestError('Configurações de SMTP não encontradas')
    }

    const leads = $app.findRecordsByFilter('leads', "email != ''", '-created', 5000, 0)
    if (leads.length === 0) {
      throw new BadRequestError('Nenhum lead encontrado')
    }

    const senderEmail = smtp.getString('sender_email')
    const senderName = smtp.getString('sender_name')
    const senderStr = `"${senderName}" <${senderEmail}>`
    const emails = leads.map((l) => l.getString('email'))

    let successCount = 0
    let failCount = 0

    for (const email of emails) {
      try {
        if (typeof MailerMessage !== 'undefined') {
          const message = new MailerMessage({
            from: { address: senderEmail, name: senderName },
            to: [{ address: email }],
            subject: subject,
            html: content,
          })
          $app.newMailClient().send(message)
        }
        successCount++
        $app.logger().info('Email Sent', 'to', email, 'from', senderStr, 'subject', subject)
      } catch (err) {
        failCount++
        $app.logger().error('Failed to send email', 'email', email, 'error', err.message)
      }
    }

    try {
      const campaigns = $app.findCollectionByNameOrId('email_campaigns')
      const record = new Record(campaigns)
      record.set('subject', subject)
      record.set('content', content)
      record.set('total_recipients', emails.length)
      record.set('status', successCount > 0 ? 'sent' : 'failed')
      $app.save(record)
    } catch (dbErr) {
      $app.logger().error('Failed to save campaign record', 'error', dbErr.message)
    }

    return e.json(200, { success: true, sent: successCount, failed: failCount })
  },
  $apis.requireAuth(),
)
