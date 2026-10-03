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

    // Hipótese A: Card token inválido retorna 406 do iPag?
    const testA = doCall({
      amount: 1,
      order_id: 'probe_hyp_token',
      callback_url: callbackUrl,
      customer: {
        name: 'Matheus Teste',
        cpf_cnpj: '79999338801',
        email: 'maton@educacaosst.com.br',
        phone: '18988887878',
      },
      payment: {
        type: 'card',
        method: 'visa',
        capture: true,
        installments: 1,
        card: {
          token: 'tok_invalid_123456789',
        },
      },
    })

    // Hipótese B: Card com campos faltando ou token vazio
    const testB = doCall({
      amount: 1,
      order_id: 'probe_hyp_card_empty',
      callback_url: callbackUrl,
      customer: {
        name: 'Matheus Teste',
        cpf_cnpj: '79999338801',
        email: 'maton@educacaosst.com.br',
        phone: '18988887878',
      },
      payment: {
        type: 'card',
        method: 'visa',
        capture: true,
        installments: 1,
        card: {},
      },
    })

    // Hipótese C: Card sem token e sem number
    const testC = doCall({
      amount: 1,
      order_id: 'probe_hyp_card_notoken',
      callback_url: callbackUrl,
      customer: {
        name: 'Matheus Teste',
        cpf_cnpj: '79999338801',
        email: 'maton@educacaosst.com.br',
        phone: '18988887878',
      },
      payment: {
        type: 'card',
        method: 'visa',
        capture: true,
        installments: 1,
      },
    })

    // Hipótese D: amount como string ou float formatado
    const testD = doCall({
      amount: 1,
      order_id: 'probe_hyp_pix_bad_amount',
      callback_url: callbackUrl,
      customer: {
        name: 'Matheus Teste',
        cpf_cnpj: '79999338801',
        email: 'maton@educacaosst.com.br',
        phone: '18988887878',
      },
      payment: {
        type: 'pix',
        method: 'pix',
      },
    })

    let log1 = new Record(eventsCol)
    log1.set('user', user.id)
    log1.set('area', 'PROBE_HYPOTHESIS_RESULT')
    log1.set('event_type', 'page_view')
    log1.set('meta', {
      testA: { status: testA.status, body: testA.json || testA.raw },
      testB: { status: testB.status, body: testB.json || testB.raw },
      testC: { status: testC.status, body: testC.json || testC.raw },
      testD: { status: testD.status, body: testD.json || testD.raw },
    })
    app.save(log1)
  },
  (app) => {},
)
