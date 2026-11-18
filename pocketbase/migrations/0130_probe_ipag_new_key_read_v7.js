// Validação de leitura da NOVA API_KEY de produção do iPag (v7 — última):
// consulta um pagamento REAL existente (ipag_id ef60a32b-... do banco) via
// GET /service/payment/{id} — somente leitura, mesmo endpoint que
// sync_ipag_payment usa em produção. NÃO cria cobrança/assinatura/token.
// Prova de autenticação: 200 = chave OK; 401 = chave recusada.
migrate(
  (app) => {
    const apiId = $secrets.get('IPAG_API_ID') || $os.getenv('IPAG_API_ID') || ''
    const apiKey = $secrets.get('IPAG_API_KEY') || $os.getenv('IPAG_API_KEY') || ''
    const baseUrl = (
      $secrets.get('IPAG_BASE_URL') ||
      $os.getenv('IPAG_BASE_URL') ||
      'https://api.ipag.com.br'
    ).replace(/\/+$/, '')

    let probe = {
      hadCredentials: false,
      realPaymentStatus: null,
      realPaymentErr: null,
      logError: null,
    }

    if (!apiId || !apiKey) {
      console.log('[IPAG_KEY_CHECK] SKIP: credenciais ausentes')
    } else {
      probe.hadCredentials = true

      const authString = apiId + ':' + apiKey
      let authBase64
      try {
        authBase64 = btoa(authString)
      } catch (_) {
        const bytes = []
        for (let i = 0; i < authString.length; i++) {
          bytes.push(authString.charCodeAt(i))
        }
        authBase64 = String.fromCharCode.apply(null, bytes)
      }

      try {
        const res = $http.send({
          url: baseUrl + '/service/payment/ef60a32b705c0ec559e6e0e683e615aa',
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Basic ' + authBase64,
            'x-api-version': '2',
          },
          timeout: 15,
        })
        probe.realPaymentStatus = res.statusCode
      } catch (err) {
        probe.realPaymentErr = err.message
      }
    }

    try {
      const user = app.findFirstRecordByData('_pb_users_auth_', 'email', 'set_life@hotmail.com')
      const eventsCol = app.findCollectionByNameOrId('access_events')
      const logRec = new Record(eventsCol)
      logRec.set('user', user.id)
      logRec.set('area', 'IPAG_KEY_CHECK_RESULT_V7')
      logRec.set('event_type', 'page_view')
      logRec.set('meta', probe)
      app.save(logRec)
    } catch (logErr) {
      console.log('[IPAG_KEY_CHECK] falha ao gravar access_events: ' + logErr.message)
    }
  },
  (app) => {},
)
