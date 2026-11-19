// Confirmação de mentoria: dispara o e-mail de confirmação quando um
// pagamento de mentoria fica 'paid'.
//
// Roda em DOIS gatilhos:
//  1. onRecordAfterCreateSuccess — pagamento já nasce 'paid' (raro, mas possível);
//  2. onRecordAfterUpdateSuccess — pagamento nasce 'pending' e é ATUALIZADO para
//     'paid' (fluxo normal: webhook iPag ou create_payment/ipag_payment
//     atualizando o status).
//
// IDEMPOTÊNCIA: procura em email_logs um registro email_type='payment_confirmed'
// gravado para o MESMO usuário (subscription vazio) criado depois do payment.
// Se já existir, não envia de novo.
//
// CONVENÇÃO JSVM: toda a lógica fica INLINE dentro de cada callback — funções e
// consts de top-level não são visíveis dentro dos callbacks da JSVM.

onRecordAfterCreateSuccess((e) => {
  try {
    var rec = e.record
    if (rec.get('product_type') !== 'mentorship' || rec.get('status') !== 'paid') {
      return
    }
    var paymentId = rec.id
    var userId = rec.get('user')
    var amount = rec.get('amount')
    var selectedSlots = rec.get('selected_slots')

    // Idempotência: já existe log de confirmação para este payment?
    var paymentCreated = ''
    try {
      var paymentRec = $app.findRecordById('payments', paymentId)
      paymentCreated = String(paymentRec.getString('created') || '')
    } catch (_) {
      paymentCreated = ''
    }
    var filter =
      "email_type = 'payment_confirmed' && user = '" +
      userId +
      "' && subscription = ''" +
      (paymentCreated ? " && created >= '" + paymentCreated + "'" : '')
    var existing = []
    try {
      existing = $app.findRecordsByFilter('email_logs', filter, '', 1, 0)
    } catch (findErr) {
      existing = []
    }
    if (existing && existing.length > 0) {
      console.log('[mentorship-payment] confirmação já enviada para payment=' + paymentId)
      return
    }

    var user
    try {
      user = $app.findRecordById('users', userId)
    } catch (uErr) {
      console.error('[mentorship-payment] usuário não encontrado: ' + userId)
      return
    }
    var email = String(user.email() || '')
    if (!email) return

    var brevoKey = String($secrets.get('BREVO_API_KEY') || $os.getenv('BREVO_API_KEY') || '').trim()
    if (!brevoKey) {
      console.error('[mentorship-payment] BREVO_API_KEY ausente — e-mail não enviado')
      return
    }

    var slotsTxt = ''
    if (selectedSlots && selectedSlots.length) {
      var parts = []
      for (var i = 0; i < selectedSlots.length; i++) {
        parts.push(String(selectedSlots[i].date || '') + ' ' + String(selectedSlots[i].time || ''))
      }
      slotsTxt = parts.join(', ')
    }

    var html =
      '<p>Olá, ' +
      String(user.get('name') || 'aluno') +
      '!</p>' +
      '<p>Seu pagamento de <strong>mentoria</strong> no valor de R$ ' +
      Number(amount || 0).toFixed(2) +
      ' foi confirmado.</p>' +
      (slotsTxt
        ? '<p>Horários escolhidos: ' + slotsTxt + '</p>'
        : '<p>Em breve você receberá o link de agendamento com o mentor.</p>') +
      '<p>Bom estudo!<br>Equipe Educação SST</p>'

    try {
      var res = $http.send({
        url: 'https://api.brevo.com/v3/smtp/email',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoKey,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Educação SST', email: 'assinante@educacaosst.com.br' },
          to: [{ email: email, name: String(user.get('name') || '') }],
          subject: 'Pagamento confirmado — Mentoria Educação SST',
          htmlContent: html,
        }),
        timeout: 30,
      })
      var sent = res.statusCode >= 200 && res.statusCode < 300

      var logCol = $app.findCollectionByNameOrId('email_logs')
      var log = new Record(logCol)
      log.set('recipient_email', email)
      log.set('recipient_name', String(user.get('name') || ''))
      log.set('email_type', 'payment_confirmed')
      log.set('sent', sent)
      log.set('sent_at', sent ? new Date().toISOString() : null)
      log.set('user', userId)
      log.set('error_message', sent ? '' : 'HTTP ' + res.statusCode)
      $app.save(log)

      console.log(
        '[mentorship-payment] e-mail de confirmação ' +
          (sent ? 'enviado' : 'falhou (HTTP ' + res.statusCode + ')') +
          ' para payment=' +
          paymentId,
      )
    } catch (sendErr) {
      console.error('[mentorship-payment] erro ao enviar e-mail: ' + sendErr.message)
    }
  } finally {
    e.next()
  }
}, 'payments')

onRecordAfterUpdateSuccess((e) => {
  try {
    var rec = e.record
    if (rec.get('product_type') !== 'mentorship') return
    if (rec.get('status') !== 'paid') return
    // Só dispara quando a atualização MUDOU o status para 'paid' (não em
    // atualizações de um registro que já estava 'paid' — e a idempotência por
    // email_logs cobre os casos restantes, como webhook repetido).
    var original = e.record.original()
    if (original && original.get('status') === 'paid') return

    var paymentId = rec.id
    var userId = rec.get('user')
    var amount = rec.get('amount')
    var selectedSlots = rec.get('selected_slots')

    // Idempotência: já existe log de confirmação para este payment?
    var paymentCreated2 = ''
    try {
      var paymentRec2 = $app.findRecordById('payments', paymentId)
      paymentCreated2 = String(paymentRec2.getString('created') || '')
    } catch (_) {
      paymentCreated2 = ''
    }
    var filter2 =
      "email_type = 'payment_confirmed' && user = '" +
      userId +
      "' && subscription = ''" +
      (paymentCreated2 ? " && created >= '" + paymentCreated2 + "'" : '')
    var existing2 = []
    try {
      existing2 = $app.findRecordsByFilter('email_logs', filter2, '', 1, 0)
    } catch (findErr2) {
      existing2 = []
    }
    if (existing2 && existing2.length > 0) {
      console.log('[mentorship-payment] confirmação já enviada para payment=' + paymentId)
      return
    }

    var user2
    try {
      user2 = $app.findRecordById('users', userId)
    } catch (uErr2) {
      console.error('[mentorship-payment] usuário não encontrado: ' + userId)
      return
    }
    var email2 = String(user2.email() || '')
    if (!email2) return

    var brevoKey2 = String(
      $secrets.get('BREVO_API_KEY') || $os.getenv('BREVO_API_KEY') || '',
    ).trim()
    if (!brevoKey2) {
      console.error('[mentorship-payment] BREVO_API_KEY ausente — e-mail não enviado')
      return
    }

    var slotsTxt2 = ''
    if (selectedSlots && selectedSlots.length) {
      var parts2 = []
      for (var j = 0; j < selectedSlots.length; j++) {
        parts2.push(String(selectedSlots[j].date || '') + ' ' + String(selectedSlots[j].time || ''))
      }
      slotsTxt2 = parts2.join(', ')
    }

    var html2 =
      '<p>Olá, ' +
      String(user2.get('name') || 'aluno') +
      '!</p>' +
      '<p>Seu pagamento de <strong>mentoria</strong> no valor de R$ ' +
      Number(amount || 0).toFixed(2) +
      ' foi confirmado.</p>' +
      (slotsTxt2
        ? '<p>Horários escolhidos: ' + slotsTxt2 + '</p>'
        : '<p>Em breve você receberá o link de agendamento com o mentor.</p>') +
      '<p>Bom estudo!<br>Equipe Educação SST</p>'

    try {
      var res2 = $http.send({
        url: 'https://api.brevo.com/v3/smtp/email',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoKey2,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Educação SST', email: 'assinante@educacaosst.com.br' },
          to: [{ email: email2, name: String(user2.get('name') || '') }],
          subject: 'Pagamento confirmado — Mentoria Educação SST',
          htmlContent: html2,
        }),
        timeout: 30,
      })
      var sent2 = res2.statusCode >= 200 && res2.statusCode < 300

      var logCol2 = $app.findCollectionByNameOrId('email_logs')
      var log2 = new Record(logCol2)
      log2.set('recipient_email', email2)
      log2.set('recipient_name', String(user2.get('name') || ''))
      log2.set('email_type', 'payment_confirmed')
      log2.set('sent', sent2)
      log2.set('sent_at', sent2 ? new Date().toISOString() : null)
      log2.set('user', userId)
      log2.set('error_message', sent2 ? '' : 'HTTP ' + res2.statusCode)
      $app.save(log2)

      console.log(
        '[mentorship-payment] e-mail de confirmação ' +
          (sent2 ? 'enviado' : 'falhou (HTTP ' + res2.statusCode + ')') +
          ' para payment=' +
          paymentId,
      )
    } catch (sendErr2) {
      console.error('[mentorship-payment] erro ao enviar e-mail: ' + sendErr2.message)
    }
  } finally {
    e.next()
  }
}, 'payments')
