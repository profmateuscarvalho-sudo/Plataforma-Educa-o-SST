routerAdd(
  'POST',
  '/backend/v1/create-payment',
  (e) => {
    const body = e.requestInfo().body || {}

    if (!body.amount || body.amount <= 0) {
      throw new BadRequestError('amount is required and must be greater than 0')
    }
    if (!body.order_id) {
      throw new BadRequestError('order_id is required')
    }
    if (!body.customer || !body.customer.name) {
      throw new BadRequestError('customer.name is required')
    }
    if (body.type !== 'card' && body.type !== 'pix') {
      throw new BadRequestError("type must be 'card' or 'pix'")
    }
    if (body.type === 'card') {
      if (
        !body.card ||
        !body.card.holder ||
        !body.card.number ||
        !body.card.expiry ||
        !body.card.cvv
      ) {
        throw new BadRequestError(
          'card object with holder, number, expiry, and cvv is required for card payments',
        )
      }
    }

    const apiId = $secrets.get('IPAG_API_ID')
    const apiKey = $secrets.get('IPAG_API_KEY')

    if (!apiId || !apiKey) {
      return e.json(500, { error: 'iPag credentials are not configured' })
    }

    let baseUrl = $secrets.get('IPAG_BASE_URL') || 'https://api.ipag.com.br'
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }

    const callbackUrl = $secrets.get('IPAG_CALLBACK_URL') || ''

    const authString = apiId + ':' + apiKey
    const authHeader = $security.md5(authString)

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

    const paymentData = {
      amount: body.amount,
      order_id: body.order_id,
      callback_url: callbackUrl,
      customer: body.customer,
    }

    if (body.type === 'card') {
      paymentData.payment = {
        type: 'card',
        capture: true,
        installments: body.card.installments || 1,
        card: {
          holder: body.card.holder,
          number: body.card.number,
          expiry: body.card.expiry,
          cvv: body.card.cvv,
        },
      }
    } else if (body.type === 'pix') {
      paymentData.payment = {
        type: 'pix',
      }
    }

    let res
    try {
      res = $http.send({
        url: baseUrl + '/v1/payment',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + authBase64,
        },
        body: JSON.stringify(paymentData),
        timeout: 30,
      })
    } catch (err) {
      $app.logger().error('iPag connection error', 'error', err.message)
      return e.json(500, { error: 'Failed to connect to iPag gateway', details: err.message })
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      let errorBody
      try {
        errorBody = res.json
      } catch (_) {
        errorBody = res.body
          ? String.fromCharCode.apply(null, new Uint8Array(res.body))
          : 'Unknown error'
      }
      $app.logger().error('iPag API returned error', 'status', res.statusCode, 'body', errorBody)
      return e.json(res.statusCode, { error: 'iPag API error', details: errorBody })
    }

    let data
    try {
      data = res.json
    } catch (err) {
      return e.json(500, { error: 'Failed to parse iPag response', details: err.message })
    }

    const response = {
      id: data.id,
      uuid: data.uuid,
      status: data.status,
      order_id: data.order_id,
      amount: data.amount,
    }

    if (body.type === 'pix' && data.pix) {
      response.pix = {
        qrcode: data.pix.qrcode,
        qrcode64: data.pix.qrcode64,
        link: data.pix.link || data.link,
      }
    }

    return e.json(200, response)
  },
  $apis.requireAuth(),
)
