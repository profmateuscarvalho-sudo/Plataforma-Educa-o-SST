migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const user = app.findFirstRecordByData('_pb_users_auth_', 'email', 'carvalhomateus@icloud.com')
    const eventsCol = app.findCollectionByNameOrId('access_events')

    const apiId = $secrets.get('IPAG_API_ID') || $os.getenv('IPAG_API_ID')
    const apiKey = $secrets.get('IPAG_API_KEY') || $os.getenv('IPAG_API_KEY')
    let baseUrl =
      $secrets.get('IPAG_BASE_URL') || $os.getenv('IPAG_BASE_URL') || 'https://api.ipag.com.br'
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }
    const callbackUrl =
      'https://educacao-sst-premium-969c2.shrd00.internal.goskip.dev/backend/v1/ipag-webhook'

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

    function doCall(payload) {
      try {
        const res = $http.send({
          url: baseUrl + '/service/payment',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + authBase64,
            'x-api-version': '2',
          },
          body: JSON.stringify(payload),
          timeout: 10,
        })
        let raw = ''
        try {
          raw = res.body ? String.fromCharCode.apply(null, new Uint8Array(res.body)) : ''
        } catch (_) {
          raw = String(res.body)
        }
        return { status: res.statusCode, json: res.json, raw: raw }
      } catch (err) {
        return { error: err.message }
      }
    }

    // Reproduzindo a chamada exata com CPF não sanitizado (000.000.000-00)
    const probeCpfFormatted = doCall({
      amount: 1,
      order_id: 'probe_check_cpf_format',
      callback_url: callbackUrl,
      customer: {
        name: 'Matheus Teste',
        cpf_cnpj: '000.000.000-00',
        email: 'maton@educacaosst.com.br',
        phone: '(18) 88887-8787',
      },
      payment: {
        type: 'card',
        method: 'visa',
        capture: true,
        installments: 1,
        card: {
          token: 'fake_token_123',
        },
      },
    })

    // Salva no registro do usuário uma string descritiva em metadata/profile para verificarmos
    const msg =
      'CPF_FORMATTED_STATUS=' +
      probeCpfFormatted.status +
      ' BODY=' +
      JSON.stringify(probeCpfFormatted.json || probeCpfFormatted.raw)
    let logItem = new Record(eventsCol)
    logItem.set('user', user.id)
    logItem.set('area', msg.slice(0, 100))
    logItem.set('event_type', 'page_view')
    app.save(logItem)
  },
  (app) => {},
)
