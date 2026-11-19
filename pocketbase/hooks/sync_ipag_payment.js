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

    // Credenciais iPag: secrets primeiro, sempre com .trim() (sem espaços/quebras/aspas).
    // DIAGNÓSTICO: loga só 4 primeiros + 4 últimos caracteres e o tamanho — nunca a chave inteira.
    var apiId = String($secrets.get('IPAG_API_ID') || $os.getenv('IPAG_API_ID') || '').trim()
    var apiKey = String($secrets.get('IPAG_API_KEY') || $os.getenv('IPAG_API_KEY') || '').trim()
    // Fallback inline DENTRO do callback (nunca top-level: scoping error na JSVM).
    // Motivo: set_env recém-atualizado não propagou para pb_hooks — o runtime ainda
    // servia a chave antiga (823C...EC38) em vez da nova de produção (4E10...939B).
    if (!apiId) {
      apiId = 'profmateus@educacaosst.com.br'
    }
    if (apiKey.substring(0, 4) !== '4E10' || apiKey.substring(apiKey.length - 4) !== '939B') {
      console.warn(
        '[ipag-creds] IPAG_API_KEY do runtime não confere com a chave nova (' +
          (apiKey
            ? apiKey.substring(0, 4) +
              '...' +
              apiKey.substring(apiKey.length - 4) +
              ' len=' +
              apiKey.length
            : 'vazio') +
          ') — usando fallback inline',
      )
      apiKey = '4E10-999FC1C2-E8C97B9F-927EE1C8-939B'
    }
    var baseUrl = String(
      $secrets.get('IPAG_BASE_URL') || $os.getenv('IPAG_BASE_URL') || 'https://api.ipag.com.br',
    )
      .trim()
      .replace(/\/+$/, '')
    if (baseUrl.indexOf('sandbox') !== -1) {
      console.warn('[ipag-creds] IPAG_BASE_URL apontava para sandbox — forçando produção')
      baseUrl = 'https://api.ipag.com.br'
    }
    console.log(
      '[ipag-creds] baseUrl=' +
        baseUrl +
        ' apiId=' +
        apiId +
        ' apiKey=' +
        apiKey.substring(0, 4) +
        '...' +
        apiKey.substring(apiKey.length - 4) +
        ' (len=' +
        apiKey.length +
        ')',
    )

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
