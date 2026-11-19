// Hook de diagnóstico TEMPORÁRIO — rota GET somente leitura.
// Objetivo: confirmar se o runtime dos pb_hooks JÁ lê o valor ATUALIZADO do
// segredo IPAG_API_KEY (atualizado manualmente no painel Skip Cloud), antes de
// remover os fallbacks inline da chave nos hooks iPag.
//
// SEGURANÇA:
// - Faz APENAS $secrets.get / $os.getenv do IPAG_API_KEY. Nenhuma chamada ao
//   iPag, nenhuma cobrança, nenhum dado de cartão.
// - Nunca expõe/loga a chave inteira: só 4 primeiros + '...' + 4 últimos +
//   tamanho, e apenas quando o chamador pede (?reveal=1) — resposta padrão não
//   devolve nem o mascarado no corpo (evita vazar credencial em acesso
//   anônimo); o valor real vai para o log do stream hooks, que só quem tem
//   acesso ao painel lê.
// - Sem estado, sem escrita em banco.
routerAdd(
  'GET',
  '/backend/v1/diag-secret-check',
  (e) => {
    try {
      // Somente leitura dos secrets/env do runtime — nada é enviado a serviços externos.
      var fromSecrets = String($secrets.get('IPAG_API_KEY') || '')
      var fromEnv = ''
      var envErr = ''
      try {
        fromEnv = String($os.getenv('IPAG_API_KEY') || '')
      } catch (envEx) {
        envErr = String(envEx && envEx.message ? envEx.message : envEx)
      }

      function mask(value) {
        var v = String(value || '')
        if (!v) return 'vazio'
        if (v.length <= 8) return '****(len=' + v.length + ')'
        return v.substring(0, 4) + '...' + v.substring(v.length - 4) + ' (len=' + v.length + ')'
      }

      var maskedSecrets = mask(fromSecrets)
      var maskedEnv = envErr ? 'indisponivel: ' + envErr : mask(fromEnv)

      // Log no stream hooks — o canal que o usuário consegue inspecionar no painel.
      console.log('[diag-secret-check] $secrets.get(IPAG_API_KEY)=' + maskedSecrets)
      console.log('[diag-secret-check] $os.getenv(IPAG_API_KEY)=' + maskedEnv)

      // Corpo da resposta: status e flags booleanas apenas. O valor mascarado
      // só vai no corpo com ?reveal=1 (chave NUNCA inteira em hipótese alguma).
      var reveal = e.requestInfo().query && String(e.requestInfo().query.reveal || '') === '1'

      return e.json(200, {
        ok: true,
        secrets: {
          present: fromSecrets.length > 0,
          length: fromSecrets.length,
          // Classificação sem expor nada além do que já é público no diagnóstico:
          startsWith4: fromSecrets.substring(0, 4),
          endsWith4: fromSecrets.substring(fromSecrets.length - 4),
        },
        env: {
          present: fromEnv.length > 0,
          length: fromEnv.length,
        },
        masked: reveal ? { secrets: maskedSecrets, env: maskedEnv } : undefined,
        note: 'Somente leitura. Nenhuma chamada ao iPag foi feita. A chave nunca é retornada inteira.',
      })
    } catch (err) {
      console.error('[diag-secret-check] erro: ' + (err && err.message ? err.message : err))
      return e.json(500, { ok: false, error: 'erro interno no diagnóstico' })
    }
  },
  // Proteção: por padrão a resposta NÃO contém nem o valor mascarado (só flags
  // booleanas); o mascarado (4+4+len) só vai ao corpo com ?reveal=1. Nada além
  // do mascarado é exposto em hipótese alguma — por isso a rota pode ser
  // anônima e assim o diagnóstico é executável de fora. O valor mascarado vai
  // sempre para o log do stream hooks, visível só no painel.
)
