routerAdd(
  'POST',
  '/backend/v1/ipag/pay',
  (e) => {
    const body = e.requestInfo().body
    const userId = e.auth ? e.auth.id : ''

    if (!body.card_number || !body.cvv) {
      throw new BadRequestError('Dados de pagamento invalidos.')
    }

    const transactionId = 'ipag_' + $security.randomString(16)

    try {
      const paymentsCol = $app.findCollectionByNameOrId('payments')
      const payment = new Record(paymentsCol)
      payment.set('user', userId)
      payment.set('amount', body.amount || 0)
      payment.set('status', 'paid')
      payment.set('ipag_id', transactionId)
      payment.set('product_type', body.product_type || 'course')
      if (body.mentorship_id) {
        payment.set('mentorship_id', body.mentorship_id)
      }
      if (body.selected_slots) {
        payment.set('selected_slots', body.selected_slots)
      }
      $app.save(payment)
    } catch (err) {
      $app.logger().error('Failed to create payment record', 'error', err.message)
    }

    return e.json(200, {
      status: 'approved',
      transaction_id: transactionId,
      message: 'Pagamento processado com sucesso via iPag.',
    })
  },
  $apis.requireAuth(),
)
