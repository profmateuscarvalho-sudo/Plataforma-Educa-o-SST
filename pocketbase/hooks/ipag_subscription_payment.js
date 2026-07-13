routerAdd(
  'POST',
  '/backend/v1/ipag/subscription/pay',
  (e) => {
    const body = e.requestInfo().body
    const userId = e.auth ? e.auth.id : ''

    if (!userId) throw new UnauthorizedError('auth required')
    if (!body.plan_id) throw new BadRequestError('plan_id is required')
    if (!body.card_number || !body.cvv) throw new BadRequestError('Dados de pagamento invalidos.')

    const plan = $app.findRecordById('subscription_plans', body.plan_id)
    var price = plan.get('price') || 0
    var interval = plan.getString('interval')
    var planName = plan.getString('name')

    var transactionId = 'ipag_' + $security.randomString(16)

    var paymentsCol = $app.findCollectionByNameOrId('payments')
    var payment = new Record(paymentsCol)
    payment.set('user', userId)
    payment.set('amount', price)
    payment.set('status', 'paid')
    payment.set('ipag_id', transactionId)
    payment.set('product_type', 'Assinatura: ' + planName)
    $app.save(payment)

    var planNameLower = planName.toLowerCase()
    var tier = 'free'
    if (planNameLower.indexOf('ouro') !== -1) {
      tier = 'ouro'
    } else if (planNameLower.indexOf('prata') !== -1) {
      tier = 'prata'
    }

    var user = $app.findRecordById('users', userId)
    var currentEndDateStr = user.getString('contract_end_date')

    var baseDate = new Date()
    if (currentEndDateStr) {
      var existing = new Date(currentEndDateStr)
      if (existing > baseDate) {
        baseDate = existing
      }
    }

    if (interval === 'monthly') {
      baseDate.setMonth(baseDate.getMonth() + 1)
    } else if (interval === 'yearly') {
      baseDate.setFullYear(baseDate.getFullYear() + 1)
    }

    var month = baseDate.getMonth() + 1
    var day = baseDate.getDate()
    var dateStr =
      baseDate.getFullYear() +
      '-' +
      (month < 10 ? '0' + month : '' + month) +
      '-' +
      (day < 10 ? '0' + day : '' + day)

    user.set('contract_end_date', dateStr)
    user.set('plan_tier', tier)
    user.set('subscription_billing', interval)
    $app.save(user)

    return e.json(200, {
      status: 'approved',
      transaction_id: transactionId,
      message: 'Pagamento processado com sucesso via iPag.',
      contract_end_date: dateStr,
      plan_tier: tier,
    })
  },
  $apis.requireAuth(),
)
