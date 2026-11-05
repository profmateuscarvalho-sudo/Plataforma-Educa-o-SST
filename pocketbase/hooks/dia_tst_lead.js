// Validações server-side + rate limit por IP para o concurso "Sou Educação SST".
// Regras aplicadas em cada criação de registro em leads_dia_tst:
//  - aceite_regulamento e aceite_lgpd devem ser true
//  - e-mail único (case-insensitive)
//  - data limite 27/11/2026 23:59:59 no horário de Brasília (UTC-3)
//  - máximo de 5 inscrições por IP a cada hora
// O campo "ip" é interno (hidden) e serve ao rate limit; a foto nunca é enviada.
onRecordCreateRequest((e) => {
  var record = e.record
  var data = e.requestInfo().body || {}
  var MAX_POR_HORA = 5

  // --- 1. Aceites obrigatórios -------------------------------------------
  if (data.aceite_regulamento !== true) {
    throw new BadRequestError('É necessário aceitar o regulamento do concurso.')
  }
  if (data.aceite_lgpd !== true) {
    throw new BadRequestError('É necessário autorizar o tratamento dos dados (LGPD).')
  }

  // --- 2. Data limite (horário de Brasília = UTC-3) ------------------------
  var limiteUtc = new Date(Date.UTC(2026, 10, 28, 2, 59, 59)) // 27/11/2026 23:59:59 BRT
  if (new Date().getTime() > limiteUtc.getTime()) {
    throw new BadRequestError(
      'As inscrições foram encerradas. O resultado sai nos canais da Revista Educação SST.',
    )
  }

  // --- 3. E-mail único (case-insensitive) ---------------------------------
  var email = String(data.email || '')
    .trim()
    .toLowerCase()
  record.set('email', email)
  try {
    var existentes = $app.findRecordsByFilter(
      'leads_dia_tst',
      "email = '" + email.replace(/'/g, "''") + "'",
      '',
      1,
      0,
    )
    if (existentes.length > 0) {
      throw new BadRequestError(
        'Este e-mail já está inscrito. Você pode montar sua capa normalmente.',
      )
    }
  } catch (err) {
    // Re-dispara o erro de e-mail duplicado; outros erros seguem o fluxo.
    if (err && String(err.message || err).indexOf('já está inscrito') !== -1) throw err
  }

  // --- 4. WhatsApp apenas dígitos ------------------------------------------
  var zaps = String(data.whatsapp || '')
  var digitos = zaps.replace(/\D/g, '')
  if (digitos.length < 10 || digitos.length > 13) {
    throw new BadRequestError('Informe um WhatsApp válido com DDD.')
  }
  record.set('whatsapp', digitos)

  // --- 5. Instagram sempre com @ -------------------------------------------
  var insta = String(data.instagram || '').trim()
  if (insta && insta.charAt(0) !== '@') insta = '@' + insta
  record.set('instagram', insta)

  // --- 6. Nome e cidade não podem ficar em branco após o trim ---------------
  var nome = String(data.nome || '').trim()
  var cidade = String(data.cidade_uf || '').trim()
  var frase = String(data.frase || '').trim()
  if (!nome || !cidade || !frase) {
    throw new BadRequestError('Preencha nome, cidade/UF e frase.')
  }
  if (nome.length > 120) throw new BadRequestError('O nome deve ter até 120 caracteres.')
  if (cidade.length > 80) throw new BadRequestError('Cidade/UF deve ter até 80 caracteres.')
  if (frase.length > 300) throw new BadRequestError('A frase deve ter até 300 caracteres.')
  record.set('nome', nome)
  record.set('cidade_uf', cidade)
  record.set('frase', frase)

  // --- 7. Campos de admin não podem ser definidos pelo público --------------
  record.set('story_verificado', false)
  record.set('nota', 0)

  // --- 8. Origem (utm_source da URL) ----------------------------------------
  var origem = String(data.origem || '').trim()
  if (origem.length > 200) origem = origem.substring(0, 200)
  record.set('origem', origem)

  // --- 9. Rate limit por IP: 5 inscrições por hora --------------------------
  var ip = ''
  try {
    ip = e.requestInfo().context.get('realClientIp') || e.realIp || ''
  } catch (_) {}
  if (!ip) {
    var fwd = e.request.header.get('X-Forwarded-For') || ''
    ip = fwd.split(',')[0].trim() || e.request.header.get('X-Real-Ip') || ''
  }
  if (!ip) ip = 'desconhecido'
  if (ip.length > 64) ip = ip.substring(0, 64)
  record.set('ip', ip)

  try {
    var horaAtras = new Date(Date.now() - 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ')
    var recentes = $app.findRecordsByFilter(
      'leads_dia_tst',
      "ip = '" + ip.replace(/'/g, "''") + "' && created >= '" + horaAtras + "'",
      '-created',
      MAX_POR_HORA,
      0,
    )
    if (recentes.length >= MAX_POR_HORA) {
      throw new BadRequestError('Muitas inscrições a partir deste dispositivo. Tente mais tarde.')
    }
  } catch (err) {
    if (err && String(err.message || err).indexOf('Muitas inscrições') !== -1) throw err
  }

  return e.next()
}, 'leads_dia_tst')
