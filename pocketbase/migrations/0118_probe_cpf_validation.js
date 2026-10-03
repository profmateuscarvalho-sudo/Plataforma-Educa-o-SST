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

    // Reproduzindo o pagamento de cartão com CPF não sanitizado ou inválido
    // Teste 1: CPF formatado '000.000.000-00'
    const payloadFormatted = {
      amount: 1,
      order_id: 'probe_cpf_000',
      callback_url: callbackUrl,
      customer: {
        name: 'sss',
        cpf_cnpj: '000.000.000-00',
        email: 'maton@educacaosst.com.br',
        phone: '(18) 88887-8787',
      },
      payment: {
        type: 'pix',
        method: 'pix',
      },
    }

    // Teste 2: CPF de teste válido no padrão da doc do iPag: '79999338801'
    const payloadValidCpf = {
      amount: 1,
      order_id: 'probe_cpf_valid',
      callback_url: callbackUrl,
      customer: {
        name: 'sss',
        cpf_cnpj: '79999338801',
        email: 'maton@educacaosst.com.br',
        phone: '(18) 88887-8787',
      },
      payment: {
        type: 'pix',
        method: 'pix',
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

    const resFormatted = doCall(payloadFormatted)
    const resValid = doCall(payloadValidCpf)

    let log1 = new Record(eventsCol)
    log1.set('user', user.id)
    log1.set('area', 'PROBE_CPF_TEST_RESULT')
    log1.set('event_type', 'page_view')
    log1.set('meta', {
      formatted: { status: resFormatted.status, json: resFormatted.json },
      valid: { status: resValid.status, json: resValid.json },
    })
    app.save(log1)
  },
  (app) => {},
)
