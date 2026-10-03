migrate(
  (app) => {
    const apiId = $secrets.get('IPAG_API_ID') || $os.getenv('IPAG_API_ID')
    const apiKey = $secrets.get('IPAG_API_KEY') || $os.getenv('IPAG_API_KEY')
    let baseUrl =
      $secrets.get('IPAG_BASE_URL') || $os.getenv('IPAG_BASE_URL') || 'https://api.ipag.com.br'
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }
    const callbackUrl =
      $secrets.get('IPAG_CALLBACK_URL') ||
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

    // Probe 1: Exatamente o payload que o app envia
    const payload1 = {
      amount: 1,
      order_id: 'probe_test_001',
      callback_url: callbackUrl,
      customer: {
        name: 'Teste Diagnostico',
        cpf_cnpj: '01234567890',
        email: 'teste@educacaosst.com.br',
        phone: '11999999999',
      },
      payment: {
        type: 'pix',
        method: 'pix',
      },
    }

    console.log('[PROBE_PAYLOAD_1] ' + JSON.stringify(payload1))

    try {
      const res1 = $http.send({
        url: baseUrl + '/service/payment',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + authBase64,
          'x-api-version': '2',
        },
        body: JSON.stringify(payload1),
        timeout: 10,
      })

      let rawBody1 = ''
      try {
        rawBody1 = res1.body ? String.fromCharCode.apply(null, new Uint8Array(res1.body)) : ''
      } catch (_) {
        rawBody1 = String(res1.body)
      }

      console.log(
        '[PROBE_RES_1] status=' +
          res1.statusCode +
          ' json=' +
          JSON.stringify(res1.json) +
          ' raw=' +
          rawBody1,
      )
    } catch (err) {
      console.log('[PROBE_ERR_1] ' + err.message)
    }
  },
  (app) => {},
)
