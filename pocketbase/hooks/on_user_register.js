// Cadastro de usuário (coleção users).
// REGRA CRÍTICA: este hook NUNCA pode derrubar a criação do registro — um erro
// aqui devolvia 400 "Failed to create record." para pessoas reais tentando se
// cadastrar. Toda lógica de plano/assinatura é efeito colateral e falha em
// silêncio (log + email_logs), nunca bloqueando o cadastro.
onRecordCreateRequest((e) => {
  var body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }
  var planId = body.plan_id || ''

  var earlyIsPaidPlan = false
  if (planId) {
    try {
      var earlyPlan = $app.findRecordById('subscription_plans', planId)
      if (earlyPlan.getFloat('price') > 0) {
        earlyIsPaidPlan = true
      }
    } catch (_) {}
  }

  // --- Mutação do registro ANTES de e.next(): também protegida -------------
  try {
    if (!e.record.getString('plan_tier') && !earlyIsPaidPlan) {
      e.record.set('plan_tier', 'free')
      e.record.set('subscription_billing', 'none')
    }

    // Todo cadastro novo nasce ATIVO com validade de +1 ano no fuso America/Sao_Paulo (UTC-3)
    // Cálculo pelas partes civis de São Paulo sem setFullYear em UTC
    var now = new Date()
    var utc = now.getTime() + now.getTimezoneOffset() * 60000
    var spDate = new Date(utc - 3 * 3600000)
    var spYear = spDate.getUTCFullYear() + 1
    var spMonth = spDate.getUTCMonth() + 1
    var spDay = spDate.getUTCDate()
    // Ajuste bissexto para 29 de fevereiro caso ocorra
    if (
      spMonth === 2 &&
      spDay === 29 &&
      (spYear % 4 !== 0 || (spYear % 100 === 0 && spYear % 400 !== 0))
    ) {
      spDay = 28
    }
    var contractEndDate =
      spYear +
      '-' +
      (spMonth < 10 ? '0' + spMonth : '' + spMonth) +
      '-' +
      (spDay < 10 ? '0' + spDay : '' + spDay)

    if (!e.record.getString('contract_end_date')) {
      e.record.set('contract_end_date', contractEndDate)
    }
    // ATENÇÃO: NÃO mexer no campo 'verified' aqui. Qualquer mutação antes de
    // e.next() entra na validação da requisição pública e a coleção users
    // recusa visitante anônimo definindo esse campo, o que devolve 400
    // "validation_values_mismatch" ("Values don't match.") para TODO cadastro.
    // A marcação como verificado acontece APÓS a criação, no bloco abaixo.
  } catch (preErr) {
    // Se algo aqui falhar, o cadastro ainda deve seguir com os valores do body
    $app
      .logger()
      .error('on_user_register: failed to prepare record (non-fatal)', 'error', preErr.message)
  }

  e.next()

  // --- Efeitos colaterais APÓS a criação: nunca propagam erro --------------
  // Marcar o aluno como verificado APÓS a criação, com privilégio de admin
  // (saveNoValidate ignora as regras de acesso da requisição pública).
  try {
    var createdUser = e.record
    try {
      createdUser = $app.findRecordById('users', e.record.id)
    } catch (_) {}
    createdUser.set('email_verificado', true)
    createdUser.setVerified(true)
    $app.saveNoValidate(createdUser)
    $app.logger().info('on_user_register: user marked as verified', 'userId', createdUser.id)
  } catch (verifyErr) {
    $app
      .logger()
      .error(
        'on_user_register: failed to mark user verified (non-fatal)',
        'error',
        verifyErr.message,
      )
  }

  try {
    var userId = e.record.id
    if (!userId) {
      try {
        var userRec = $app.findAuthRecordByEmail('users', e.record.getString('email'))
        userId = userRec.id
      } catch (_) {
        return
      }
    }

    if (e.record.getString('role') !== 'student') return

    var targetPlanId = ''
    var isPaidPlan = false

    if (planId) {
      try {
        var plan = $app.findRecordById('subscription_plans', planId)
        var planPrice = plan.getFloat('price')
        if (planPrice > 0) {
          targetPlanId = planId
          isPaidPlan = true
          $app
            .logger()
            .info(
              'Paid plan selected on registration',
              'planId',
              planId,
              'planName',
              plan.getString('name'),
              'planPrice',
              planPrice,
            )
        } else {
          targetPlanId = planId
        }
      } catch (_) {
        $app
          .logger()
          .warn(
            'Invalid plan_id passed during registration, falling back to Free',
            'planId',
            planId,
          )
      }
    }

    if (!targetPlanId) {
      try {
        var freePlan = $app.findFirstRecordByFilter('subscription_plans', 'price = 0')
        targetPlanId = freePlan.id
        var freePlanPrice = freePlan.getFloat('price')
        var freePlanName = freePlan.getString('name')
        $app
          .logger()
          .info(
            'Free plan identified on registration',
            'planId',
            targetPlanId,
            'planName',
            freePlanName,
            'planPrice',
            freePlanPrice,
          )
      } catch (planErr) {
        $app
          .logger()
          .error('Failed to locate Free plan during registration', 'error', planErr.message)

        try {
          var regLogsCol = $app.findCollectionByNameOrId('email_logs')
          var regLogRecord = new Record(regLogsCol)
          regLogRecord.set('recipient_email', e.record.getString('email'))
          regLogRecord.set('recipient_name', e.record.getString('name'))
          regLogRecord.set('email_type', 'activation_free')
          regLogRecord.set('sent', false)
          regLogRecord.set('brevo_synced', false)
          regLogRecord.set('brevo_list_id', 0)
          regLogRecord.set('brevo_status', 0)
          regLogRecord.set(
            'error_message',
            'Failed to locate Free plan during registration: ' + planErr.message,
          )
          regLogRecord.set('user', userId)
          $app.saveNoValidate(regLogRecord)
        } catch (logErr) {
          $app
            .logger()
            .error('Failed to log registration error to email_logs', 'error', logErr.message)
        }
      }
    }

    try {
      $app.runInTransaction(function (txApp) {
        var existingSub = null
        try {
          existingSub = txApp.findFirstRecordByFilter('subscriptions', "user = '" + userId + "'")
        } catch (_) {}

        if (existingSub) {
          if (targetPlanId) {
            existingSub.set('plan', targetPlanId)
            txApp.save(existingSub)
          }
          return
        }

        var subsCol = txApp.findCollectionByNameOrId('subscriptions')
        var subRecord = new Record(subsCol)
        subRecord.set('user', userId)
        subRecord.set('status', 'pending')
        if (targetPlanId) {
          subRecord.set('plan', targetPlanId)
        }
        txApp.save(subRecord)

        $app
          .logger()
          .info(
            'Subscription created on registration',
            'userId',
            userId,
            'planId',
            targetPlanId,
            'isPaid',
            isPaidPlan,
          )
      })
    } catch (err) {
      $app.logger().error('Failed to create subscription on register', 'error', err.message)
    }
  } catch (sideErr) {
    // Qualquer falha aqui NÃO pode devolver 400 — o usuário já foi criado.
    $app
      .logger()
      .error('on_user_register: side effects failed (non-fatal)', 'error', sideErr.message)
  }
}, 'users')
