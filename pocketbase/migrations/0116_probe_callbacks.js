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
    const secretCallback = $secrets.get('IPAG_CALLBACK_URL') || ''

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

    // Teste A: callback com https://educacao-sst-premium-969c2.shrd00.internal.goskip.dev/backend/v1/ipag-webhook
    const payloadGoskip = {
      amount: 1,
      order_id: 'probe_goskip_001',
      callback_url:
        'https://educacao-sst-premium-969c2.shrd00.internal.goskip.dev/backend/v1/ipag-webhook',
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

    // Teste B: exatamente o payload com secretCallback
    const payloadSecret = {
      amount: 1,
      order_id: 'probe_secret_001',
      callback_url: secretCallback,
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

    const resGoskip = doCall(payloadGoskip)
    const resSecret = doCall(payloadSecret)

    // Descreve os resultados em campos menores de texto ou registros separados
    let logGoskip = new Record(eventsCol)
    logGoskip.set('user', user.id)
    logGoskip.set('area', 'PROBE_GOSKIP_RESULT')
    logGoskip.set('event_type', 'page_view')
    logGoskip.set('meta', {
      status: resGoskip.status,
      json: resGoskip.json,
      raw: resGoskip.raw,
      callback_url: payloadGoskip.callback_url,
    })
    app.save(logGoskip)

    let logSecret = new Record(eventsCol)
    logSecret.set('user', user.id)
    logSecret.set('area', 'PROBE_SECRET_RESULT')
    logSecret.set('event_type', 'page_view')
    logSecret.set('meta', {
      status: resSecret.status,
      json: resSecret.json,
      raw: resSecret.raw,
      callback_url: payloadSecret.callback_url,
    })
    app.save(logSecret)
  },
  (app) => {},
)
