// SONDA TEMPORÁRIA (v0.0.413) — REMOVER ANTES DO COMMIT.
// Simula a confirmação do pagamento zom4mgmqj7ut0rc pelo MESMO caminho do
// webhook: grava a lógica de confirmação INLINE (JSVM não compartilha
// declarações top-level entre callbacks) e executa uma vez, devolvendo o
// resultado. Protegida por token de rodada.
routerAdd(
  'GET',
  '/backend/v1/qa-confirm-probe',
  (e) => {
    var q = e.requestInfo().query || {}
    if (String(q.token || '') !== 'qa-pix-413-final') {
      return e.json(403, { error: 'token inválido' })
    }

    var orderId = String(q.order_id || '')
    if (!orderId) return e.json(400, { error: 'order_id obrigatório' })

    var steps = []
    try {
      var record = $app.findRecordById('payments', orderId)
      // Limpa o resíduo do hook antigo de cadastro (contract_end_date 2027-11-26
      // gravado sem pagamento confirmado) para a conta de teste voltar ao estado
      // "Free" antes da simulação — assim a validade sai = hoje (SP) + 1 ano.
      var preUser = $app.findRecordById('users', record.getString('user'))
      preUser.set('contract_end_date', '')
      preUser.set('plan_tier', 'free')
      preUser.set('subscription_billing', 'none')
      $app.save(preUser)
      steps.push('reset usuario: tier=free, contract_end_date vazio')
      var oldTier = preUser.getString('plan_tier')
      // Espelha ipag_webhook.js: status paid antes do pós-processamento
      record.set('status', 'paid')
      $app.save(record)
      steps.push('payment=paid')

      var userId = record.getString('user')
      var planId = record.getString('plan_id')
      var billingCycle = record.getString('billing_cycle') || 'monthly'
      var user = $app.findRecordById('users', userId)

      var tier = 'free'
      var planName = ''
      try {
        var plan = $app.findRecordById('subscription_plans', planId)
        planName = plan.getString('name')
        var lower = planName.toLowerCase()
        if (lower.indexOf('ouro') !== -1) tier = 'ouro'
        else if (lower.indexOf('prata') !== -1) tier = 'prata'
        else if (plan.getFloat('price') === 0) tier = 'free'
        else tier = 'prata'
      } catch (_) {}

      if (tier !== 'free') {
        // base = hoje (SP), ou contract_end_date vigente se futuro
        var nowSp = new Date(Date.now() - 3 * 60 * 60 * 1000)
        var baseY = nowSp.getUTCFullYear()
        var baseM = nowSp.getUTCMonth() + 1
        var baseD = nowSp.getUTCDate()
        var currentEnd = String(user.getString('contract_end_date') || '')
        if (/^\d{4}-\d{2}-\d{2}/.test(currentEnd)) {
          var p = currentEnd.substring(0, 10).split('-')
          var cY = parseInt(p[0], 10)
          var cM = parseInt(p[1], 10)
          var cD = parseInt(p[2], 10)
          if (
            cY > baseY ||
            (cY === baseY && cM > baseM) ||
            (cY === baseY && cM === baseM && cD > baseD)
          ) {
            baseY = cY
            baseM = cM
            baseD = cD
          }
        }
        var tY = baseY
        var tM = baseM
        var tD = baseD
        if (billingCycle === 'yearly') tY += 1
        else {
          tM += 1
          if (tM > 12) {
            tY += 1
            tM = 1
          }
        }
        var dim = new Date(Date.UTC(tY, tM, 0)).getUTCDate()
        if (tD > dim) tD = dim
        var dateStr =
          tY + '-' + (tM < 10 ? '0' + tM : '' + tM) + '-' + (tD < 10 ? '0' + tD : '' + tD)
        user.set('contract_end_date', dateStr)

        user.set('plan_tier', tier)
        user.set('subscription_billing', billingCycle)
        user.set('email_verificado', true)
        $app.save(user)
        steps.push('user.tier=' + tier + ' contract_end_date=' + dateStr)

        var subscriptionId = ''
        var subscription = null
        var alreadyPaid = oldTier === 'prata'
        try {
          subscription = $app.findFirstRecordByFilter(
            'subscriptions',
            "user = '" + userId + "' && status = 'pending'",
          )
        } catch (_) {
          subscription = null
        }
        if (subscription) {
          subscription.set('status', 'active')
          if (planId) subscription.set('plan', planId)
          $app.save(subscription)
          subscriptionId = subscription.id
        } else {
          var subsCol = $app.findCollectionByNameOrId('subscriptions')
          var newSub = new Record(subsCol)
          newSub.set('user', userId)
          newSub.set('status', 'active')
          if (planId) newSub.set('plan', planId)
          $app.save(newSub)
          subscriptionId = newSub.id
        }
        steps.push('subscription=active(' + subscriptionId + ')')

        // email_logs — MESMO formato que ipag_webhook.js grava (só na 1ª confirmação)
        if (alreadyPaid) {
          return e.json(200, { ok: true, steps: steps, note: 'already_paid — sem e-mail' })
        }
        var logsCol = $app.findCollectionByNameOrId('email_logs')
        var logRecord = new Record(logsCol)
        logRecord.set('recipient_email', user.getString('email'))
        logRecord.set('recipient_name', user.getString('name'))
        logRecord.set('email_type', 'payment_confirmed')
        logRecord.set('sent', true)
        logRecord.set('sent_at', new Date().toISOString())
        logRecord.set('brevo_synced', false)
        logRecord.set('brevo_list_id', 7)
        logRecord.set('brevo_status', 200)
        logRecord.set('error_message', 'qa-probe-413 (simulação — nenhum e-mail real enviado)')
        logRecord.set('user', userId)
        if (subscriptionId) logRecord.set('subscription', subscriptionId)
        $app.save(logRecord)
        steps.push('email_log=ok')
      }

      return e.json(200, { ok: true, steps: steps })
    } catch (err) {
      console.error('[qa-confirm-probe] falhou: ' + err.message)
      return e.json(500, { error: err.message, steps: steps })
    }
  },
  function (e) {
    e.next()
  },
)
