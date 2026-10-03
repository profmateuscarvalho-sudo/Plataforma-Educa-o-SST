// Sincronização e consulta iPag para administradores
routerAdd(
  'POST',
  '/backend/v1/admin/sync-ipag-payment',
  (e) => {
    var user = e.auth
    if (!user || user.getString('role') !== 'admin') {
      return e.unauthorizedError('Acesso restrito para administradores')
    }

    var body = {}
    try {
      body = e.requestInfo().body || {}
    } catch (_) {
      body = {}
    }
    var orderId = body.order_id || ''

    if (!orderId) {
      return e.badRequestError('order_id é obrigatório')
    }

    var apiId = $secrets.get('IPAG_API_ID')
    var apiKey = $secrets.get('IPAG_API_KEY')
    var baseUrl = ($secrets.get('IPAG_BASE_URL') || 'https://api.ipag.com.br').replace(/\/+$/, '')

    if (!apiId || !apiKey) {
      return e.json(500, { error: 'Credenciais iPag não configuradas' })
    }

    var authString = apiId + ':' + apiKey
    var authBase64 = ''
    try {
      authBase64 = btoa(authString)
    } catch (_) {
      var bytes = []
      for (var bi = 0; bi < authString.length; bi++) {
        bytes.push(authString.charCodeAt(bi))
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
      return e.json(502, {
        error: 'Falha na conexão com iPag para consulta',
        details: err.message,
      })
    }

    var consultData = null
    try {
      consultData = consultRes.json
    } catch (_) {
      consultData = consultRes.body
        ? String.fromCharCode.apply(null, new Uint8Array(consultRes.body))
        : null
    }

    var attributes = consultData ? consultData.attributes || consultData : {}
    var rawStatus = ''
    if (attributes.status && typeof attributes.status === 'object' && attributes.status.message) {
      rawStatus = attributes.status.message
    } else if (attributes.status != null) {
      rawStatus = String(attributes.status)
    }

    var upper = (rawStatus || '').toUpperCase()
    var isPaid =
      upper.indexOf('APPROV') !== -1 ||
      upper.indexOf('CAPTUR') !== -1 ||
      upper.indexOf('PAID') !== -1

    var ipagUuid =
      (consultData && (consultData.uuid || consultData.id)) ||
      attributes.uuid ||
      attributes.id ||
      ''

    var paymentRecord = null
    try {
      paymentRecord = $app.findRecordById('payments', orderId)
    } catch (pErr) {
      return e.json(404, {
        error: 'Registro de pagamento não encontrado na base',
        order_id: orderId,
        ipagResponse: consultData,
      })
    }

    var previousStatus = paymentRecord.getString('status')
    var updated = false

    if (isPaid && previousStatus !== 'paid') {
      paymentRecord.set('status', 'paid')
      if (ipagUuid) {
        paymentRecord.set('ipag_id', ipagUuid)
      }
      // Salvar o registro dispara o hook onRecordAfterUpdateSuccess em on_subscription_payment.js
      $app.save(paymentRecord)
      updated = true
    }

    return e.json(200, {
      order_id: orderId,
      raw_status: rawStatus,
      is_paid: isPaid,
      previous_status: previousStatus,
      new_status: paymentRecord.getString('status'),
      record_updated: updated,
      ipag_uuid: ipagUuid,
      ipag_data: consultData,
    })
  },
  $apis.requireAuth(),
)
