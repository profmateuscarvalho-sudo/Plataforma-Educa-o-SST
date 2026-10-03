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

    // Reproduzindo o pagamento de cartão que falhou em 9t5l84sukf3fsj9 / jputhzt54y7xl22
    // Teste 1: Cartão com token e callback_url goskip.dev
    const payloadCardToken = {
      amount: 1,
      order_id: 'probe_card_tok_1',
      callback_url: callbackUrl,
      customer: {
        name: 'sss',
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
          token: 'fake_token_or_test_token',
        },
      },
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

    const res1 = doCall(payloadCardToken)

    let logCard = new Record(eventsCol)
    logCard.set('user', user.id)
    logCard.set('area', 'PROBE_CARD_TOK_RESULT')
    logCard.set('event_type', 'page_view')
    logCard.set('meta', {
      status: res1.status,
      json: res1.json,
      raw: res1.raw,
      payload: payloadCardToken,
    })
    app.save(logCard)
  },
  (app) => {},
)
