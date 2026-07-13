onRecordAfterCreateSuccess((e) => {
  const record = e.record
  if (record.getString('status') !== 'paid') return e.next()
  if (record.getString('product_type') !== 'mentorship') return e.next()

  const mentorshipId = record.getString('mentorship_id')
  if (!mentorshipId) return e.next()

  let mentorship
  try {
    mentorship = $app.findRecordById('mentorships', mentorshipId)
  } catch (_) {
    return e.next()
  }

  let user
  try {
    user = $app.findRecordById('users', record.getString('user'))
  } catch (_) {
    return e.next()
  }

  let slots = []
  try {
    const raw = record.get('selected_slots')
    if (typeof raw === 'string') {
      slots = JSON.parse(raw)
    } else if (Array.isArray(raw)) {
      slots = raw
    }
  } catch (_) {}

  let slotsHtml = ''
  for (let i = 0; i < slots.length; i++) {
    slotsHtml += '<li>' + (slots[i].date || '') + ' as ' + (slots[i].time || '') + '</li>'
  }

  let smtp
  try {
    smtp = $app.findFirstRecordByFilter('smtp_settings', '1=1')
  } catch (_) {
    return e.next()
  }

  var senderEmail = smtp.getString('sender_email')
  var senderName = smtp.getString('sender_name')
  var userEmail = user.getString('email')
  var userName = user.getString('name') || 'Aluno'
  var mentorshipTitle = mentorship.getString('title')
  var mentorName = mentorship.getString('mentor_name')
  var schedulingLink = mentorship.getString('scheduling_link') || ''

  var html = '<h2>Confirmacao de Agendamento de Mentoria</h2>'
  html += '<p>Ola ' + userName + ',</p>'
  html += '<p>Sua mentoria foi confirmada com sucesso!</p>'
  html += '<p><strong>Mentoria:</strong> ' + mentorshipTitle + '</p>'
  html += '<p><strong>Mentor:</strong> ' + mentorName + '</p>'
  html += '<p><strong>Datas e horarios selecionados:</strong></p>'
  html += '<ul>' + slotsHtml + '</ul>'
  if (schedulingLink) {
    html +=
      '<p><strong>Link de acesso:</strong> <a href="' +
      schedulingLink +
      '">' +
      schedulingLink +
      '</a></p>'
  }
  html += '<p>Estamos a disposicao para qualquer duvida.</p><p>Equipe Educacao SST</p>'

  try {
    var message = new MailerMessage({
      from: { address: senderEmail, name: senderName },
      to: [{ address: userEmail }],
      subject: 'Confirmacao de Mentoria - Educacao SST',
      html: html,
    })
    $app.newMailClient().send(message)
    $app
      .logger()
      .info('Mentorship confirmation email sent', 'to', userEmail, 'mentorship', mentorshipTitle)
  } catch (err) {
    $app.logger().error('Failed to send mentorship email', 'error', err.message)
  }

  return e.next()
}, 'payments')
