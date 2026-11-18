/**
 * Diagnóstico de falha no cadastro (POST /api/collections/users/records -> 400).
 * O log de requests só mostra "Failed to create record."; aqui registramos a
 * causa exata (campo + mensagem de validação) no stream de hooks, antes de
 * propagar o erro padrão do PocketBase.
 *
 * IMPORTANTE (goja/pocketbase): `err.raw()` sobre o ApiError do create devolve
 * uma STRING JSON, não um objeto — `if (validation)` era truthy, mas
 * JSON.stringify(validation) devolvia a string SEM aspas duplas… na prática o
 * log perdia o detalhe. Aqui fazemos stringify só quando o raw NÃO é string,
 * e logamos também err.message, name, status e o shape do body recebido.
 *
 * REGRA: sem imports de módulos externos — todos os hooks deste projeto usam
 * apenas globais ($app, $os, $secrets, onRecordCreateRequest). Um import de
 * "$os" faz o bundler tratar "$os" como dependência npm e o deploy falha com
 * ERR_PNPM_INVALID_DEPENDENCY_NAME.
 */
onRecordCreateRequest((e) => {
  try {
    e.next()
  } catch (err) {
    var email = '(sem e-mail no body)'
    var planId = '(sem plan_id no body)'
    try {
      var body = e.requestInfo().body || {}
      if (body.email) email = body.email
      if (body.plan_id) planId = body.plan_id
      delete body.password
      delete body.passwordConfirm
    } catch (_) {}

    var parts = []
    try {
      parts.push('name=' + (err.name || typeof err))
    } catch (_) {}
    try {
      parts.push('status=' + (err.status !== undefined ? err.status : '?'))
    } catch (_) {}
    try {
      var fk = []
      for (var k in err) {
        try {
          fk.push(k + '=' + typeof err[k])
        } catch (_) {
          fk.push(k + '=?')
        }
      }
      parts.push('ownProps=[' + fk.join(' ') + ']')
    } catch (_) {}
    try {
      parts.push('message=' + (err.message || '(sem mensagem)'))
    } catch (_) {}
    try {
      var raw = err.raw ? err.raw() : null
      var rawStr =
        raw === null || raw === undefined
          ? '(vazio)'
          : typeof raw === 'string'
            ? raw
            : JSON.stringify(raw)
      parts.push('raw=' + rawStr)
    } catch (rawErr) {
      parts.push('raw-error=' + rawErr.message)
    }
    try {
      parts.push('rawKeys=' + (err.raw ? Object.keys(err.raw() || {}).join(',') : '(n/a)'))
    } catch (_) {}
    try {
      parts.push(
        'proto=' +
          (Object.getPrototypeOf(err)
            ? Object.getPrototypeOf(err).constructor.name
            : '(sem proto)'),
      )
    } catch (_) {}
    try {
      parts.push('hasValidation=' + (err.validation ? 'true' : 'false'))
    } catch (_) {}
    try {
      parts.push('hasRawData=' + (err.rawData ? 'true' : 'false'))
    } catch (_) {}
    try {
      parts.push(
        'isValidationError=' +
          (typeof ValidationError !== 'undefined' ? err instanceof ValidationError : '(n/a)'),
      )
    } catch (_) {}

    var detail =
      '[user_register_diag] create failed | email=' +
      email +
      ' | plan_id=' +
      planId +
      ' | ' +
      parts.join(' | ')

    // Motivo exato no stream de hooks (ex.: validation_failure no campo email)
    console.error(detail)
    $app.logger().error('User create failed (register)', 'email', String(email), 'error', detail)

    // Propaga o erro original: o frontend resolve a mensagem específica a partir
    // do campo do 400 (email => "já cadastrado"; password => "senha fraca"; etc).
    throw err
  }
}, 'users')
