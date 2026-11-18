// Validação de leitura da NOVA API_KEY de produção do iPag (v5 — a v4 obteve
// 401 em /service/resources/customers; aqui testamos 2 endpoints de LEITURA
// para isolar se o 401 é da chave ou do endpoint: (A) consulta de pagamento
// existente GET /service/payment/{id} e (B) listagem de clientes).
// NÃO cria cobrança, assinatura nem token de cartão.
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
      A_paymentStatus: null,
      A_err: null,
      B_customersStatus: null,
      B_err: null,
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

      const read = (url) => {
        try {
          const res = $http.send({
            url: url,
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: 'Basic ' + authBase64,
              'x-api-version': '2',
            },
            timeout: 15,
          })
          return res.statusCode
        } catch (err) {
          return 'ERR: ' + err.message
        }
      }

      // (A) consulta de pagamento existente (somente leitura, mesmo endpoint
      // que o hook sync_ipag_payment usa em produção)
      probe.A_paymentStatus = read(baseUrl + '/service/payment/6ceigkbvl7pinu5')
      // (B) listagem de clientes
      probe.B_customersStatus = read(baseUrl + '/service/resources/customers?per_page=1')
    }

    try {
      const user = app.findFirstRecordByData('_pb_users_auth_', 'email', 'set_life@hotmail.com')
      const eventsCol = app.findCollectionByNameOrId('access_events')
      const logRec = new Record(eventsCol)
      logRec.set('user', user.id)
      logRec.set('area', 'IPAG_KEY_CHECK_RESULT_V5')
      logRec.set('event_type', 'page_view')
      logRec.set('meta', probe)
      app.save(logRec)
    } catch (logErr) {
      console.log('[IPAG_KEY_CHECK] falha ao gravar access_events: ' + logErr.message)
    }
  },
  (app) => {},
)
