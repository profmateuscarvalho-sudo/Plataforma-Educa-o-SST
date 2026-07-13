routerAdd('POST', '/backend/v1/ipag-webhook', (e) => {
  const body = e.requestInfo().body || {}

  const source = body.attributes || body

  const orderId = source.order_id || ''
  if (!orderId) {
    return e.json(400, { error: 'order_id ausente no payload' })
  }

  let status = ''
  if (source.status && typeof source.status === 'object' && source.status.message) {
    status = source.status.message
  } else if (source.status != null) {
    status = String(source.status)
  }

  const amount = source.amount != null ? source.amount : 0

  console.log('[ipag-webhook] Pedido ' + orderId + ' -> status: ' + status + ' (R$ ' + amount + ')')

  return e.json(200, { received: true })
})
