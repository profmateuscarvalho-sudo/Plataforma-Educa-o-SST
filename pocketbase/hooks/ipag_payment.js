// Checkout de cursos/mentorias via iPag com tokenização server-side.
//
// Fluxo: o frontend primeiro chama POST /backend/v1/ipag/tokenize-card
// (ipag_tokenize_card.js) e depois envia aqui APENAS o token + bandeira.
// Este hook valida o payload, chama POST /service/payment do iPag com o
// token e grava o pagamento.
//
// SEGURANÇA: este endpoint NUNCA recebe número de cartão nem CVV — apenas
// o token gerado server-side. Nada sensível é gravado em banco ou logado.
routerAdd(
  'POST',
  '/backend/v1/ipag/pay',
  (e) => {
    const body = e.requestInfo().body || {}
    const userId = e.auth ? e.auth.id : ''
    if (!userId) throw new UnauthorizedError('auth required')

    if (!body.card_token) {
      throw new BadRequestError(
        'Token do cartão ausente. Tokenize o cartão via /backend/v1/ipag/tokenize-card antes de pagar.',
      )
    }
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestError('amount is required and must be greater than 0')
    }

    // Credenciais server-side via secrets (NUNCA com valor inline no código).
    // NUNCA logar apiId/apiKey.
    var apiId = $secrets.get('IPAG_API_ID') || $os.getenv('IPAG_API_ID') || ''
    var apiKey = $secrets.get('IPAG_API_KEY') || $os.getenv('IPAG_API_KEY') || ''
    if (!apiId || !apiKey) {
      console.error('[ipag-pay] credenciais iPag ausentes (IPAG_API_ID/IPAG_API_KEY)')
      throw new ApiError(500, 'Erro do servidor ao processar o pagamento.')
    }

    var baseUrl = (
      $secrets.get('IPAG_BASE_URL') ||
      $os.getenv('IPAG_BASE_URL') ||
      'https://api.ipag.com.br'
    ).replace(/\/+$/, '')

    var authString = apiId + ':' + apiKey
    var authBase64
    try {
      authBase64 = btoa(authString)
    } catch (_) {
      var bytes = []
      for (var i = 0; i < authString.length; i++) {
        bytes.push(authString.charCodeAt(i))
      }
      authBase64 = String.fromCharCode.apply(null, bytes)
    }

    // Cria o registro de pagamento pendente (order_id vem do próprio registro)
    var paymentsCol = $app.findCollectionByNameOrId('payments')
    var paymentRecord = new Record(paymentsCol)
    paymentRecord.set('user', userId)
    paymentRecord.set('amount', body.amount)
    paymentRecord.set('status', 'pending')
    paymentRecord.set('product_type', body.product_type || 'course')
    if (body.mentorship_id) {
      paymentRecord.set('mentorship_id', body.mentorship_id)
    }
    if (body.selected_slots) {
      paymentRecord.set('selected_slots', body.selected_slots)
    }
    try {
      $app.save(paymentRecord)
    } catch (err) {
      $app.logger().error('Failed to create payment record', 'error', err.message)
      throw new ApiError(500, 'Erro do servidor ao registrar o pagamento.')
    }
    var paymentRecordId = paymentRecord.id

    var customer = body.customer || {}
    var paymentData = {
      amount: body.amount,
      order_id: paymentRecordId,
      callback_url:
        'https://educacao-sst-premium-969c2.shrd00.internal.goskip.dev/backend/v1/ipag-webhook',
      customer: {
        name: customer.name || '',
        cpf_cnpj: customer.cpf_cnpj || '',
        email: customer.email || '',
        phone: customer.phone || '',
      },
      payment: {
        type: 'card',
        method: body.card_method || 'visa',
        capture: true,
        installments: body.installments || 1,
        card: {
          token: body.card_token,
        },
      },
    }

    function mapStatus(rawStatus) {
      if (!rawStatus) return 'pending'
      var upper = String(rawStatus).toUpperCase()
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
    } catch (httpErr) {
      console.error('[ipag-pay] falha de conexão com iPag: ' + httpErr.message)
      try {
        var recFail = $app.findRecordById('payments', paymentRecordId)
        recFail.set('status', 'failed')
        $app.save(recFail)
      } catch (_) {}
      throw new ApiError(502, 'Erro do servidor ao processar o pagamento. Tente novamente.')
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      // Nunca logar o corpo bruto (pode ecoar dados do pagador); só o status.
      console.error('[ipag-pay] iPag recusou o pagamento, status=' + res.statusCode)
      try {
        var recRefused = $app.findRecordById('payments', paymentRecordId)
        recRefused.set('status', 'failed')
        $app.save(recRefused)
      } catch (_) {}
      throw new ApiError(402, 'Pagamento recusado, tente outro cartão.')
    }

    var data = res.json || {}
    var attributes = data.attributes || data
    var rawStatus = ''
    if (attributes.status && typeof attributes.status === 'object' && attributes.status.message) {
      rawStatus = attributes.status.message
    } else if (attributes.status != null) {
      rawStatus = String(attributes.status)
    }
    var mappedStatus = mapStatus(rawStatus)
    var ipagUuid = data.uuid || attributes.uuid || ''

    try {
      var recOk = $app.findRecordById('payments', paymentRecordId)
      recOk.set('status', mappedStatus)
      if (ipagUuid) {
        recOk.set('ipag_id', ipagUuid)
      }
      $app.save(recOk)
    } catch (updErr) {
      $app
        .logger()
        .error(
          'Failed to update payment record',
          'recordId',
          paymentRecordId,
          'error',
          updErr.message,
        )
    }

    if (mappedStatus === 'failed') {
      throw new ApiError(402, 'Pagamento recusado, tente outro cartão.')
    }
    if (mappedStatus === 'pending') {
      return e.json(200, {
        status: 'pending',
        payment_id: paymentRecordId,
        message: 'Pagamento em processamento.',
      })
    }

    return e.json(200, {
      status: 'approved',
      payment_id: paymentRecordId,
      transaction_id: ipagUuid,
      message: 'Pagamento processado com sucesso via iPag.',
    })
  },
  $apis.requireAuth(),
)
