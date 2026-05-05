// @deps nodemailer@6.9.13
routerAdd(
  'POST',
  '/backend/v1/leads/send-email',
  async (e) => {
    const nodemailer = require('nodemailer')

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

    const enc = smtp.getString('encryption')
    const secure = enc === 'SSL'
    const port = smtp.getInt('port') || (secure ? 465 : 587)

    const transporter = nodemailer.createTransport({
      host: smtp.getString('host'),
      port: port,
      secure: secure,
      auth: {
        user: smtp.getString('user'),
        pass: smtp.getString('password'),
      },
    })

    const senderStr = `"${smtp.getString('sender_name')}" <${smtp.getString('sender_email')}>`

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${content}
    </body>
    </html>
  `

    const emails = leads.map((l) => l.getString('email'))

    let successCount = 0
    let failCount = 0

    for (const email of emails) {
      try {
        await transporter.sendMail({
          from: senderStr,
          to: email,
          subject: subject,
          html: html,
          headers: {
            Precedence: 'bulk',
            'List-Unsubscribe': `<mailto:${smtp.getString('sender_email')}?subject=unsubscribe>`,
          },
        })
        successCount++
      } catch (err) {
        failCount++
        $app.logger().error('Failed to send email', 'email', email, 'error', err.message)
      }
    }

    try {
      const campaigns = $app.findCollectionByNameOrId('email_campaigns')
      const Record = require('pocketbase').Record
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
