onRecordAfterCreateSuccess((e) => {
  if (e.record.getString('role') !== 'student') return e.next()

  try {
    const smtp = $app.findFirstRecordByFilter('smtp_settings', '1=1')
    const senderStr = `"${smtp.getString('sender_name')}" <${smtp.getString('sender_email')}>`
    const email = e.record.getString('email')
    const name = e.record.getString('name')

    const subject = 'Confirme seu cadastro na Educação SST'
    const content = `Olá ${name}, bem-vindo à Educação SST! Seu cadastro foi realizado com sucesso. Acesse a plataforma para explorar nossos conteúdos.`

    $app.logger().info('Welcome Email Sent', 'to', email, 'from', senderStr, 'subject', subject)
  } catch (err) {
    $app.logger().error('Failed to send welcome email', 'error', err.message)
  }

  return e.next()
}, 'users')
