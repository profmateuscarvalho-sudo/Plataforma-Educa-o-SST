// @deps nodemailer@6.9.13
routerAdd(
  'POST',
  '/backend/v1/workshop-invitations/{id}/send',
  (e) => {
    const nodemailer = require('nodemailer')
    const id = e.request.pathValue('id')
    const inv = $app.findRecordById('workshop_invitations', id)
    const event = $app.findRecordById('events', inv.getString('event'))

    if (!inv.getString('guest_email')) {
      return e.badRequestError('Este convite não possui um e-mail associado.')
    }

    let smtp
    try {
      smtp = $app.findFirstRecordByFilter('smtp_settings', "id != ''")
    } catch (err) {
      return e.internalServerError('Configurações SMTP não encontradas no sistema.')
    }

    const transporter = nodemailer.createTransport({
      host: smtp.getString('host'),
      port: smtp.getInt('port'),
      secure: smtp.getString('encryption') === 'SSL',
      auth: {
        user: smtp.getString('user'),
        pass: smtp.getString('password'),
      },
    })

    const inviteUrl = 'https://educacaosst.goskip.app/convite/' + inv.getString('token')

    const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #d97706;">Olá ${inv.getString('guest_name')},</h2>
      <p>Você foi selecionado(a) como convidado(a) VIP para o nosso evento exclusivo:</p>
      <h3 style="font-size: 20px; font-weight: bold;">${event.getString('title')}</h3>
      <p>Sua presença é muito importante para nós. Por favor, acesse o link abaixo para visualizar os detalhes do evento e confirmar sua participação.</p>
      <div style="margin: 30px 0;">
        <a href="${inviteUrl}" style="background-color: #f59e0b; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Acessar meu Convite VIP</a>
      </div>
      <p style="font-size: 14px; color: #666;">Se você não puder comparecer, por favor nos avise acessando o mesmo link.</p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999;">Educação SST Premium</p>
    </div>
  `

    try {
      transporter.sendMail({
        from: `"${smtp.getString('sender_name')}" <${smtp.getString('sender_email')}>`,
        to: inv.getString('guest_email'),
        subject: `Convite VIP Exclusivo - ${event.getString('title')}`,
        html: html,
      })
      return e.json(200, { success: true })
    } catch (err) {
      $app.logger().error('Error sending VIP invite', 'error', err.message)
      return e.internalServerError('Falha ao enviar e-mail. Verifique as configurações SMTP.')
    }
  },
  $apis.requireAuth(),
)
