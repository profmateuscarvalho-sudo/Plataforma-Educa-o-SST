routerAdd(
  'POST',
  '/backend/v1/workshop-invitations/{id}/send',
  (e) => {
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
      // Ignore, fallback to system's native SMTP config
    }

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

    // Use string concatenation to hide the module name from the bundler's static analysis
    const m = 'mai' + 'ler'
    const mailer = require(m)

    const senderAddress = smtp ? smtp.getString('sender_email') : $app.settings().meta.senderAddress
    const senderName = smtp ? smtp.getString('sender_name') : $app.settings().meta.senderName

    if (!senderAddress) {
      return e.internalServerError('Endereço de remetente não configurado.')
    }

    const message = new mailer.Message({
      from: {
        address: senderAddress,
        name: senderName,
      },
      to: [{ address: inv.getString('guest_email') }],
      subject: `Convite VIP Exclusivo - ${event.getString('title')}`,
      html: html,
    })

    try {
      $app.newMailClient().send(message)
      return e.json(200, { success: true })
    } catch (err) {
      $app.logger().error('Error sending VIP invite via native mailer', 'error', err.message)
      return e.internalServerError('Falha ao enviar e-mail. Verifique as configurações SMTP.')
    }
  },
  $apis.requireAuth(),
)
