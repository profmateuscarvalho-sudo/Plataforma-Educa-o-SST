routerAdd(
  'POST',
  '/backend/v1/create-payment',
  (e) => {
    const body = e.requestInfo().body || {}
    const userId = e.auth ? e.auth.id : ''

    if (!userId) throw new UnauthorizedError('auth required')

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
      if (
        !body.card ||
        !body.card.method ||
        !body.card.holder ||
        !body.card.number ||
        !body.card.expiry_month ||
        !body.card.expiry_year ||
        !body.card.cvv
      ) {
        throw new BadRequestError(
          'card object with method, holder, number, expiry_month, expiry_year, and cvv is required for card payments',
        )
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

    const callbackUrl = $secrets.get('IPAG_CALLBACK_URL') || ''

    var fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
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
      paymentRecord.set('product_type', body.product_type || '')
      if (body.plan_id) {
        paymentRecord.set('plan_id', body.plan_id)
      }
      if (body.billing_cycle) {
        paymentRecord.set('billing_cycle', body.billing_cycle)
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
        card: {
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

    var res
    try {
      res = $http.send({
        url: baseUrl + '/service/payment',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + authBase64,
          'x-api-version': '2',
        },
        body: JSON.stringify(paymentData),
        timeout: 30,
      })
    } catch (err) {
      $app.logger().error('iPag connection error', 'error', err.message)
      updatePaymentStatus(paymentRecordId, 'failed', '')
      return e.json(500, {
        error: 'Failed to connect to iPag gateway',
        details: err.message,
      })
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      var errorBody
      try {
        errorBody = res.json
      } catch (_) {
        errorBody = res.body
          ? String.fromCharCode.apply(null, new Uint8Array(res.body))
          : 'Unknown error'
      }
      $app.logger().error('iPag API returned error', 'status', res.statusCode, 'body', errorBody)
      updatePaymentStatus(paymentRecordId, 'failed', '')
      return e.json(res.statusCode, {
        error: 'iPag API error',
        details: errorBody,
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
