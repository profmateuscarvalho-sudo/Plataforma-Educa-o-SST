routerAdd('POST', '/backend/v1/ipag-webhook', (e) => {
  const body = e.requestInfo().body || {}
  const source = body.attributes || body

  const orderId = source.order_id || ''
  if (!orderId) {
    $app.logger().warn('[ipag-webhook] Payload received without order_id')
    return e.json(200, { received: true })
  }

  const apiId = $secrets.get('IPAG_API_ID')
  const apiKey = $secrets.get('IPAG_API_KEY')

  if (!apiId || !apiKey) {
    $app.logger().error('[ipag-webhook] iPag credentials not configured', 'order_id', orderId)
    return e.json(502, {
      error: 'Verificação falhou: credenciais iPag não configuradas',
    })
  }

  let baseUrl = $secrets.get('IPAG_BASE_URL') || 'https://api.ipag.com.br'
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1)
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

  var consultRes
  try {
    consultRes = $http.send({
      url: baseUrl + '/service/consult?order_id=' + orderId,
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + authBase64,
        'x-api-version': '2',
      },
      timeout: 30,
    })
  } catch (err) {
    $app
      .logger()
      .error(
        '[ipag-webhook] Consultation request failed',
        'order_id',
        orderId,
        'error',
        err.message,
      )
    return e.json(502, {
      error: 'Verificação falhou: não foi possível consultar o status da transação no iPag',
    })
  }

  if (consultRes.statusCode < 200 || consultRes.statusCode >= 300) {
    $app
      .logger()
      .error(
        '[ipag-webhook] Consultation API returned error',
        'status',
        consultRes.statusCode,
        'order_id',
        orderId,
      )
    return e.json(502, {
      error: 'Verificação falhou: o iPag retornou um erro ao consultar o status da transação',
    })
  }

  var consultData
  try {
    consultData = consultRes.json
  } catch (err) {
    $app
      .logger()
      .error(
        '[ipag-webhook] Failed to parse consultation response',
        'order_id',
        orderId,
        'error',
        err.message,
      )
    return e.json(502, {
      error: 'Verificação falhou: não foi possível processar a resposta do iPag',
    })
  }

  if (!consultData) {
    $app.logger().error('[ipag-webhook] Empty consultation response', 'order_id', orderId)
    return e.json(502, {
      error: 'Verificação falhou: o iPag retornou uma resposta vazia',
    })
  }

  var attributes = consultData.attributes || consultData
  var rawStatus = ''
  if (attributes.status && typeof attributes.status === 'object' && attributes.status.message) {
    rawStatus = attributes.status.message
  } else if (attributes.status != null) {
    rawStatus = String(attributes.status)
  }

  if (!rawStatus) {
    $app.logger().error('[ipag-webhook] No status in consultation response', 'order_id', orderId)
    return e.json(502, {
      error: 'Verificação falhou: o status da transação não foi retornado pelo iPag',
    })
  }

  var ipagId = consultData.uuid || consultData.id || source.uuid || source.id || ''

  var upper = (rawStatus || '').toUpperCase()
  var mappedStatus = 'pending'
  if (
    upper.indexOf('APPROV') !== -1 ||
    upper.indexOf('CAPTUR') !== -1 ||
    upper.indexOf('PAID') !== -1
  ) {
    mappedStatus = 'paid'
  } else if (
    upper.indexOf('DENIED') !== -1 ||
    upper.indexOf('REFUS') !== -1 ||
    upper.indexOf('FAIL') !== -1 ||
    upper.indexOf('CANCEL') !== -1
  ) {
    mappedStatus = 'failed'
  }

  try {
    var record = $app.findRecordById('payments', orderId)
    record.set('status', mappedStatus)
    if (ipagId) {
      record.set('ipag_id', ipagId)
    }
    $app.save(record)
    $app
      .logger()
      .info(
        '[ipag-webhook] Payment ' + orderId + ' verified and updated to ' + mappedStatus,
        'rawStatus',
        rawStatus,
        'ipagId',
        ipagId,
      )
    return e.json(200, { received: true, verified: true, status: mappedStatus })
  } catch (err) {
    $app
      .logger()
      .error(
        '[ipag-webhook] Payment record not found for order_id: ' + orderId,
        'order_id',
        orderId,
        'error',
        err.message,
      )
    return e.json(404, {
      error: 'payment record not found',
      order_id: orderId,
    })
  }
})
