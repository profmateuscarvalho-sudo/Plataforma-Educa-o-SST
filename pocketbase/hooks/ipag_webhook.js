routerAdd('POST', '/backend/v1/ipag-webhook', (e) => {
  const body = e.requestInfo().body || {}

  const source = body.attributes || body

  const orderId = source.order_id || ''
  if (!orderId) {
    console.log('[ipag-webhook] Payload received without order_id')
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

  console.log(
    '[ipag-webhook] Pedido ' + orderId + ' -> status: ' + rawStatus + ' => ' + mappedStatus,
  )

  try {
    var record = $app.findRecordById('payments', orderId)
    record.set('status', mappedStatus)
    if (ipagId) {
      record.set('ipag_id', ipagId)
    }
    $app.save(record)
    console.log('[ipag-webhook] Payment ' + orderId + ' updated to ' + mappedStatus)
  } catch (err) {
    console.log('[ipag-webhook] Failed to update payment ' + orderId + ': ' + err.message)
  }

  return e.json(200, { received: true })
})
