routerAdd(
  'POST',
  '/backend/v1/ipag/pay',
  (e) => {
    const body = e.requestInfo().body

    // Fake the iPag payment gateway processing
    // In a real scenario, use $http.send to POST to the iPag API
    const url = $secrets.get('IPAG_API_URL') || 'https://sandbox.ipag.com.br/service/payment'

    if (!body.card_number || !body.cvv) {
      throw new BadRequestError('Dados de pagamento inválidos.')
    }

    // Simulated success response
    const transactionId = 'ipag_' + $security.randomString(16)

    return e.json(200, {
      status: 'approved',
      transaction_id: transactionId,
      message: 'Pagamento processado com sucesso via iPag.',
    })
  },
  $apis.requireAuth(),
)
