routerAdd(
  'POST',
  '/backend/v1/create-payment',
  (e) => {
    const body = e.requestInfo().body || {}
    const userId = e.auth ? e.auth.id : ''

    if (!userId) throw new UnauthorizedError('auth required')

    // Verificação estrita para fluxo de assinatura:
    // product_type='subscription', plan_id e billing_cycle DEVEM ser fornecidos
    if (body.product_type === 'subscription' || body.plan_id || body.billing_cycle) {
      if (!body.product_type || body.product_type !== 'subscription') {
        throw new BadRequestError(
          "product_type deve ser 'subscription' para pagamentos de assinatura",
        )
      }
      if (!body.plan_id || typeof body.plan_id !== 'string' || body.plan_id.trim() === '') {
        throw new BadRequestError('plan_id é obrigatório para pagamentos de assinatura')
      }
      if (body.billing_cycle !== 'monthly' && body.billing_cycle !== 'yearly') {
        throw new BadRequestError(
          "billing_cycle deve ser 'monthly' ou 'yearly' para pagamentos de assinatura",
        )
      }
    }

    if (!body.amount || body.amount <= 0) {
      throw new BadRequestError('amount is required and must be greater than 0')
    }
    if (!body.customer || !body.customer.name) {
      throw new BadRequestError('customer.name is required')
    }
    if (!body.customer || !body.customer.cpf_cnpj) {
      throw new BadRequestError('customer.cpf_cnpj is required')
    }
    if (body.type !== 'card' && body.type !== 'pix') {
      throw new BadRequestError("type must be 'card' or 'pix'")
    }
    if (body.type === 'card') {
      if (!body.card || !body.card.method) {
        throw new BadRequestError('card object with method is required for card payments')
      }
      if (body.card.token) {
        // Tokenized card: only token and method (and optional installments) are required
      } else {
        // Legacy card without token: full card data is required
        if (
          !body.card.holder ||
          !body.card.number ||
          !body.card.expiry_month ||
          !body.card.expiry_year ||
          !body.card.cvv
        ) {
          throw new BadRequestError(
            'card object with holder, number, expiry_month, expiry_year, and cvv is required when token is not provided',
          )
        }
      }
    }

    const apiId = $secrets.get('IPAG_API_ID')
    const apiKey = $secrets.get('IPAG_API_KEY')

    if (!apiId || !apiKey) {
      return e.json(500, {
        error: 'iPag credentials are not configured',
        details: 'IPAG_API_ID or IPAG_API_KEY is missing from secrets',
      })
    }

    let baseUrl = $secrets.get('IPAG_BASE_URL') || 'https://api.ipag.com.br'
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }

    const callbackUrl =
      'https://educacao-sst-premium-969c2.shrd00.internal.goskip.dev/backend/v1/ipag-webhook'

    var fiveMinAgoDate = new Date(Date.now() - 5 * 60 * 1000)
    var fiveMinAgo = fiveMinAgoDate.toISOString().slice(0, 19).replace('T', ' ')
    var recentPayments
    try {
      recentPayments = $app.findRecordsByFilter(
        'payments',
        "user = '" + userId + "' && created >= '" + fiveMinAgo + "'",
        '-created',
        5,
        0,
      )
    } catch (cntErr) {
      recentPayments = []
    }
    if (recentPayments.length >= 5) {
      return e.json(429, {
        error: 'Muitas tentativas de pagamento. Aguarde alguns minutos e tente novamente.',
      })
    }

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

    var paymentRecord = null
    var paymentRecordId = ''

    try {
      var paymentsCol = $app.findCollectionByNameOrId('payments')
      paymentRecord = new Record(paymentsCol)
      paymentRecord.set('user', userId)
      paymentRecord.set('amount', body.amount)
      paymentRecord.set('status', 'pending')

      if (body.product_type === 'subscription') {
        paymentRecord.set('product_type', 'subscription')
        paymentRecord.set('plan_id', body.plan_id)
        paymentRecord.set('billing_cycle', body.billing_cycle)
      } else {
        paymentRecord.set('product_type', body.product_type || '')
        if (body.plan_id) {
          paymentRecord.set('plan_id', body.plan_id)
        }
        if (body.billing_cycle) {
          paymentRecord.set('billing_cycle', body.billing_cycle)
        }
      }

      if (body.mentorship_id) {
        paymentRecord.set('mentorship_id', body.mentorship_id)
      }
      if (body.selected_slots) {
        paymentRecord.set('selected_slots', body.selected_slots)
      }
      $app.save(paymentRecord)
      paymentRecordId = paymentRecord.id
    } catch (err) {
      $app.logger().error('Failed to create payment record', 'error', err.message)
      return e.json(500, { error: 'Failed to create payment record', details: err.message })
    }

    var paymentData = {
      amount: body.amount,
      order_id: paymentRecordId,
      callback_url: callbackUrl,
      customer: body.customer,
    }

    if (body.type === 'card') {
      paymentData.payment = {
        type: 'card',
        method: body.card.method,
        capture: true,
        installments: body.card.installments || 1,
        card: body.card.token
          ? {
              token: body.card.token,
            }
          : {
              holder: body.card.holder,
              number: body.card.number,
              expiry_month: body.card.expiry_month,
              expiry_year: body.card.expiry_year,
              cvv: body.card.cvv,
            },
      }
    } else if (body.type === 'pix') {
      paymentData.payment = {
        type: 'pix',
        method: 'pix',
      }
    }

    function mapStatus(rawStatus) {
      if (!rawStatus) return 'pending'
      var upper = rawStatus.toUpperCase()
      if (
        upper.indexOf('APPROV') !== -1 ||
        upper.indexOf('CAPTUR') !== -1 ||
        upper.indexOf('PAID') !== -1
      ) {
        return 'paid'
      }
      if (
        upper.indexOf('DENIED') !== -1 ||
        upper.indexOf('REFUS') !== -1 ||
        upper.indexOf('FAIL') !== -1 ||
        upper.indexOf('CANCEL') !== -1
      ) {
        return 'failed'
      }
      return 'pending'
    }

    function updatePaymentStatus(recordId, status, ipagId) {
      try {
        var rec = $app.findRecordById('payments', recordId)
        rec.set('status', status)
        if (ipagId) {
          rec.set('ipag_id', ipagId)
        }
        $app.save(rec)
      } catch (updErr) {
        $app
          .logger()
          .error('Failed to update payment record', 'recordId', recordId, 'error', updErr.message)
      }
    }

    // Log do payload exato que será enviado ao iPag (mascarando dados ultra-sensíveis de cartão se houver)
    var loggedPayload = JSON.parse(JSON.stringify(paymentData))
    if (loggedPayload.payment && loggedPayload.payment.card && loggedPayload.payment.card.cvv) {
      loggedPayload.payment.card.cvv = '***'
    }
    if (loggedPayload.payment && loggedPayload.payment.card && loggedPayload.payment.card.number) {
      loggedPayload.payment.card.number =
        loggedPayload.payment.card.number.slice(0, 6) +
        '******' +
        loggedPayload.payment.card.number.slice(-4)
    }
    console.log('[DEBUG_IPAG_PAYLOAD_SENT] ' + JSON.stringify(loggedPayload))

    var tIpagStart = Date.now()
    var res
    try {
      res = $http.send({
        url: baseUrl + '/service/payment',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Basic ' + authBase64,
          'x-api-version': '2',
        },
        body: JSON.stringify(paymentData),
        timeout: 30,
      })
    } catch (err) {
      var tIpagErr = Date.now() - tIpagStart
      console.log('[DEBUG_IPAG_HTTP_ERROR] duration=' + tIpagErr + 'ms error=' + err.message)
      $app.logger().error('iPag connection error', 'error', err.message)
      updatePaymentStatus(paymentRecordId, 'failed', '')
      return e.json(500, {
        error: 'Failed to connect to iPag gateway',
        details: err.message,
      })
    }

    var tIpagDuration = Date.now() - tIpagStart
    console.log(
      '[DEBUG_IPAG_RESPONSE_STATUS] status=' + res.statusCode + ' duration=' + tIpagDuration + 'ms',
    )

    if (res.statusCode < 200 || res.statusCode >= 300) {
      var rawBodyString = ''
      if (res.raw) {
        rawBodyString = String(res.raw)
      } else if (res.body) {
        try {
          rawBodyString = String.fromCharCode.apply(null, new Uint8Array(res.body))
        } catch (_) {
          rawBodyString = String(res.body)
        }
      }
      var errorBody = res.json || rawBodyString || 'Unknown error'
      console.log(
        '[DEBUG_IPAG_RESPONSE_406_BODY] status=' +
          res.statusCode +
          ' body=' +
          JSON.stringify(errorBody) +
          ' raw=' +
          rawBodyString,
      )
      $app.logger().error('iPag API returned error', 'status', res.statusCode, 'body', errorBody)
      updatePaymentStatus(paymentRecordId, 'failed', '')
      return e.json(res.statusCode, {
        error: 'iPag API error',
        status: res.statusCode,
        details: errorBody,
        raw: rawBodyString,
        payload_sent: loggedPayload,
      })
    }

    var data
    try {
      data = res.json
    } catch (err) {
      updatePaymentStatus(paymentRecordId, 'failed', '')
      return e.json(500, { error: 'Failed to parse iPag response', details: err.message })
    }

    var ipagUuid = data.uuid || ''
    var attributes = data.attributes || data
    var rawStatus = ''
    if (attributes.status && typeof attributes.status === 'object' && attributes.status.message) {
      rawStatus = attributes.status.message
    } else if (attributes.status != null) {
      rawStatus = String(attributes.status)
    }

    var mappedStatus = mapStatus(rawStatus)

    updatePaymentStatus(paymentRecordId, mappedStatus, ipagUuid)

    var response = {
      payment_id: paymentRecordId,
      ipag_id: ipagUuid,
      status: mappedStatus,
    }

    if (body.type === 'pix' && attributes.pix) {
      response.pix = {
        qrcode: attributes.pix.qrcode,
        qrcode64: attributes.pix.qrcode64,
        link: attributes.pix.link || attributes.link,
      }
    }

    return e.json(200, response)
  },
  $apis.requireAuth(),
)
