onRecordAfterCreateSuccess(
  (e) => {
    try {
      const mailClient = $app.newMailClient()
      const msg = new mailer.Message({
        from: { address: 'no-reply@educacaosst.com', name: 'Educação SST' },
        to: [{ address: 'admin@educacaosst.com' }],
        subject: 'Nova submissão recebida',
        html: '<p>Uma nova submissão foi recebida na plataforma Educação SST. Acesse o painel de administração para visualizar os detalhes.</p>',
      })
      mailClient.send(msg)
    } catch (err) {
      console.log('Failed to send notification email:', err)
    }
    e.next()
  },
  'articles',
  'professional_connections',
)
