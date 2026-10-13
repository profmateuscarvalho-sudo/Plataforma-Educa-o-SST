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
    var price = plan.getFloat('price') || 0
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

    // Cálculo no fuso America/Sao_Paulo (UTC-3) por partes civis
    var nowIpagPay = new Date()
    var utcIpagPay = nowIpagPay.getTime() + nowIpagPay.getTimezoneOffset() * 60000
    var spIpagPay = new Date(utcIpagPay - 3 * 3600000)

    var baseYear = spIpagPay.getUTCFullYear()
    var baseMonth = spIpagPay.getUTCMonth() + 1
    var baseDay = spIpagPay.getUTCDate()

    if (currentEndDateStr && /^\d{4}-\d{2}-\d{2}/.test(currentEndDateStr)) {
      var cParts = currentEndDateStr.substring(0, 10).split('-')
      var cY = parseInt(cParts[0], 10)
      var cM = parseInt(cParts[1], 10)
      var cD = parseInt(cParts[2], 10)
      if (
        cY > baseYear ||
        (cY === baseYear && cM > baseMonth) ||
        (cY === baseYear && cM === baseMonth && cD > baseDay)
      ) {
        baseYear = cY
        baseMonth = cM
        baseDay = cD
      }
    }

    var targetYear = baseYear
    var targetMonth = baseMonth
    var targetDay = baseDay

    if (interval === 'yearly') {
      targetYear += 1
    } else {
      targetMonth += 1
      if (targetMonth > 12) {
        targetYear += 1
        targetMonth = 1
      }
    }

    var daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate()
    if (targetDay > daysInTargetMonth) {
      targetDay = daysInTargetMonth
    }

    var dateStr =
      targetYear +
      '-' +
      (targetMonth < 10 ? '0' + targetMonth : '' + targetMonth) +
      '-' +
      (targetDay < 10 ? '0' + targetDay : '' + targetDay)

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
