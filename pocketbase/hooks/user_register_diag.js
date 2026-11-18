import { findAuthRecordByEmail } from '$os'

/**
 * Diagnóstico de falha no cadastro (POST /api/collections/users/records -> 400).
 * O log de requests só mostra "Failed to create record."; aqui registramos a
 * causa exata (campo + mensagem de validação) no stream de hooks, antes de
 * propagar o erro padrão do PocketBase.
 */
onRecordCreateRequest((e) => {
  try {
    e.next()
  } catch (err) {
    const email = (() => {
      try {
        return (e.requestInfo().body || {}).email || '(sem e-mail no body)'
      } catch (_) {
        return '(sem e-mail no body)'
      }
    })()

    let detail = err.message || '(sem mensagem)'
    try {
      const validation = err.raw && err.raw() ? err.raw() : null
      if (validation) detail = JSON.stringify(validation)
    } catch (_) {
      /* mantém err.message */
    }

    // Motivo exato no stream de hooks (ex.: validation_failure no campo email)
    console.error('[user_register_diag] create failed | email=' + email + ' | error=' + detail)
    $app.logger().error('User create failed (register)', 'email', String(email), 'error', detail)

    // Duplicidade real: o PocketBase já devolve 400 com email validation_error.
    // Aqui apenas deixamos o erro original seguir — a mensagem específica de
    // "e-mail já cadastrado" é resolvida no frontend a partir do campo email.
    throw err
  }
}, 'users')
