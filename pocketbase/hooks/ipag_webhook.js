routerAdd('POST', '/backend/v1/ipag-webhook', (e) => {
  const body = e.requestInfo().body || {}

  const source = body.attributes || body

  const orderId = source.order_id || ''
  if (!orderId) {
    $app.logger().warn('[ipag-webhook] Payload received without order_id')
    return e.json(200, { received: true })
  }

  let rawStatus = ''
  if (source.status && typeof source.status === 'object' && source.status.message) {
    rawStatus = source.status.message
  } else if (source.status != null) {
    rawStatus = String(source.status)
  }

  var ipagId = source.uuid || source.id || ''

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
        '[ipag-webhook] Payment ' + orderId + ' updated to ' + mappedStatus,
        'rawStatus',
        rawStatus,
        'ipagId',
        ipagId,
      )
    return e.json(200, { received: true })
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
    return e.json(404, { error: 'payment record not found', order_id: orderId })
  }
})
