/**
 * Diagnóstico de falha no cadastro (POST /api/collections/users/records -> 400).
 * O log de requests só mostra "Failed to create record."; aqui registramos a
 * causa exata (campo + mensagem de validação) no stream de hooks, antes de
 * propagar o erro padrão do PocketBase.
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
    try {
      var body = e.requestInfo().body || {}
      if (body.email) email = body.email
    } catch (_) {}

    var detail = err.message || '(sem mensagem)'
    try {
      var validation = err.raw && err.raw() ? err.raw() : null
      if (validation) detail = JSON.stringify(validation)
    } catch (_) {
      /* mantém err.message */
    }

    // Motivo exato no stream de hooks (ex.: validation_failure no campo email)
    console.error('[user_register_diag] create failed | email=' + email + ' | error=' + detail)
    $app.logger().error('User create failed (register)', 'email', String(email), 'error', detail)

    // Propaga o erro original: o frontend resolve a mensagem específica a partir
    // do campo do 400 (email => "já cadastrado"; password => "senha fraca"; etc).
    throw err
  }
}, 'users')
