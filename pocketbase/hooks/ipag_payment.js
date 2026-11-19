// Checkout de cursos/mentorias via iPag com tokenização server-side.
//
// Fluxo: o frontend primeiro chama POST /backend/v1/ipag/tokenize-card
// (ipag_tokenize_card.js) e depois envia aqui APENAS o token + bandeira.
// Este hook valida o payload, chama POST /service/payment do iPag com o
// token e grava o pagamento.
//
// SEGURANÇA: este endpoint NUNCA recebe número de cartão nem CVV — apenas
// o token gerado server-side. Nada sensível é gravado em banco ou logado.
// Quando o iPag recusa, a razão real retornada por ele (sanitizada) é
// repassada ao frontend.
//
// BLOCO 3 — desconto de 30% em mentorias para Prata/Ouro, calculado AQUI no
// servidor; o amount vindo do navegador é ignorado.
//
// IMPORTANTE (limitação da JSVM desta plataforma): callbacks executam em pool
// separado — NÃO referencie declarações top-level dentro deles. Todo helper é
// declarado DENTRO do corpo do callback.
routerAdd(
  'POST',
  '/backend/v1/ipag/pay',
  (e) => {
    const body = e.requestInfo().body || {}
    const userId = e.auth ? e.auth.id : ''
    if (!userId) throw new UnauthorizedError('auth required')

    if (!body.card_token) {
      throw new BadRequestError(
        'Token do cartão ausente. Tokenize o cartão via /backend/v1/ipag/tokenize-card antes de pagar.',
      )
    }

    // --- tier efetivo (inline — JSVM: nada de top-level) ---
    // 1 = Free, 2 = Prata, 3 = Ouro, 4 = admin. Tier do usuário SÓ vale com
    // contract_end_date >= hoje (fuso SP, UTC-3 fixo); vencido = Free. Um
    // subscription 'active' de plano Prata/Ouro com contrato vigente também
    // conta (o webhook pode atualizar apenas um dos lugares).
    function nivelEfetivo(uid) {
      if (!uid) return 1
      var rec = null
      try {
        rec = $app.findRecordById('users', uid)
      } catch (_) {
        return 1
      }
      var hoje = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
      var best = 1
      var role = ''
      try {
        role = String(rec.getString('role') || '')
      } catch (_) {}
      if (role === 'admin') return 4
      var fim = ''
      try {
        fim = String(rec.getString('contract_end_date') || '').trim()
      } catch (_) {}
      var contratoOk = !fim || fim.slice(0, 10) >= hoje
      var t = ''
      try {
        t = String(rec.getString('plan_tier') || '').toLowerCase()
      } catch (_) {}
      if (contratoOk && t === 'ouro') best = 3
      else if (contratoOk && t === 'prata') best = 2
      try {
        var subs = $app.findRecordsByFilter(
          'subscriptions',
          "user = '" + uid + "' && status = 'active'",
          '-created',
          20,
          0,
        )
        for (var i = 0; i < subs.length; i++) {
          var fimSub = ''
          try {
            fimSub = String(subs[i].getString('contract_end_date') || '').trim()
          } catch (_) {}
          if (fimSub && fimSub.slice(0, 10) < hoje) continue
          var pid = ''
          try {
            pid = subs[i].getString('plan')
          } catch (_) {}
          if (!pid) continue
          var plano = null
          try {
            plano = $app.findRecordById('subscription_plans', pid)
          } catch (_) {
            continue
          }
          var nome = ''
          try {
            nome = String(plano.getString('name') || '').toLowerCase()
          } catch (_) {}
          if (nome.indexOf('ouro') !== -1) best = Math.max(best, 3)
          else if (nome.indexOf('prata') !== -1) best = Math.max(best, 2)
        }
      } catch (_) {}
      return best
    }

    // Preço resolvido no SERVIDOR a partir do cadastro (nunca confiar no amount
    // enviado pelo frontend). Cursos vêm de courses.price; mentorias de mentorships.price.
    var productType = body.product_type || 'course'
    var serverAmount = 0
    if (productType === 'course') {
      if (!body.course_id) {
        throw new BadRequestError('course_id é obrigatório para compra avulsa de curso')
      }
      var courseRec
      try {
        courseRec = $app.findRecordById('courses', body.course_id)
      } catch (courseErr) {
        throw new NotFoundError('Curso não encontrado.')
      }
      serverAmount = Number(courseRec.get('price') || 0)
      if (!(serverAmount > 0)) {
        throw new BadRequestError('Curso sem preço válido para compra avulsa.')
      }
    } else if (productType === 'mentorship') {
      if (!body.mentorship_id) {
        throw new BadRequestError('mentorship_id é obrigatório para compra avulsa de mentoria')
      }
      var mentorshipRec
      try {
        mentorshipRec = $app.findRecordById('mentorships', body.mentorship_id)
      } catch (mentErr) {
        throw new NotFoundError('Mentoria não encontrada.')
      }
      serverAmount = Number(mentorshipRec.get('price') || 0)
      // 30% de desconto para Prata/Ouro (nível >= 2). Free paga o preço cheio.
      var nivelPagador = nivelEfetivo(userId)
      if (nivelPagador >= 2) {
        var cheio = serverAmount
        serverAmount = Math.max(0.01, Math.round(cheio * 0.7 * 100) / 100)
        console.log(
          '[ipag-pay][mentorship] desconto 30% (nivel ' +
            nivelPagador +
            '): ' +
            cheio +
            ' -> ' +
            serverAmount,
        )
      }
      if (!(serverAmount > 0)) {
        throw new BadRequestError('Mentoria sem preço válido para compra avulsa.')
      }
    } else {
      if (!body.amount || body.amount <= 0) {
        throw new BadRequestError('amount is required and must be greater than 0')
      }
      serverAmount = body.amount
    }

    // Credenciais iPag: lidas dos secrets/env do runtime, sempre com .trim()
    // (sem espaços/quebras/aspas). Sem fallback literal no código.
    // DIAGNÓSTICO: loga só 4 primeiros + 4 últimos caracteres e o tamanho — nunca a chave inteira.
    var apiId = String($secrets.get('IPAG_API_ID') || $os.getenv('IPAG_API_ID') || '').trim()
    var apiKey = String($secrets.get('IPAG_API_KEY') || $os.getenv('IPAG_API_KEY') || '').trim()
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
    var authBase64
    try {
      authBase64 = btoa(authString)
    } catch (_) {
      var bytes = []
      for (var i = 0; i < authString.length; i++) {
        bytes.push(authString.charCodeAt(i))
      }
      authBase64 = String.fromCharCode.apply(null, bytes)
    }

    // Cria o registro de pagamento pendente (order_id vem do próprio registro)
    var paymentsCol = $app.findCollectionByNameOrId('payments')
    var paymentRecord = new Record(paymentsCol)
    paymentRecord.set('user', userId)
    paymentRecord.set('amount', serverAmount)
    paymentRecord.set('status', 'pending')
    paymentRecord.set('product_type', productType)
    if (productType === 'course' && body.course_id) {
      paymentRecord.set('course_id', body.course_id)
    }
    if (body.mentorship_id) {
      paymentRecord.set('mentorship_id', body.mentorship_id)
    }
    if (body.selected_slots) {
      paymentRecord.set('selected_slots', body.selected_slots)
    }
    try {
      $app.save(paymentRecord)
    } catch (err) {
      $app.logger().error('Failed to create payment record', 'error', err.message)
      throw new ApiError(500, 'Erro do servidor ao registrar o pagamento.')
    }
    var paymentRecordId = paymentRecord.id

    var customer = body.customer || {}
    var paymentData = {
      amount: serverAmount,
      order_id: paymentRecordId,
      callback_url:
        'https://educacao-sst-premium-969c2.shrd00.internal.goskip.dev/backend/v1/ipag-webhook',
      customer: {
        name: customer.name || '',
        cpf_cnpj: customer.cpf_cnpj || '',
        email: customer.email || '',
        phone: customer.phone || '',
      },
      payment: {
        type: 'card',
        method: body.card_method || 'visa',
        capture: true,
        installments: body.installments || 1,
        card: {
          token: body.card_token,
        },
      },
    }

    function mapStatus(rawStatus) {
      if (!rawStatus) return 'pending'
      var upper = String(rawStatus).toUpperCase()
      if (
        upper.indexOf('APPROV') !== -1 ||
        upper.indexOf('CAPTUR') !== -1 ||
        upper.indexOf('PAID') !== -1
      ) {
        return 'paid'
      }
      if (
        upper.indexOf('DENIED') !== -1 ||
        upper.indexOf('REFUS') !== -1 ||
        upper.indexOf('FAIL') !== -1 ||
        upper.indexOf('CANCEL') !== -1
      ) {
        return 'failed'
      }
      return 'pending'
    }

    var res
    try {
      res = $http.send({
        url: baseUrl + '/service/payment',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Basic ' + authBase64,
          'x-api-version': '2',
        },
        body: JSON.stringify(paymentData),
        timeout: 30,
      })
    } catch (httpErr) {
      console.error('[ipag-pay] falha de conexão com iPag: ' + httpErr.message)
      try {
        var recFail = $app.findRecordById('payments', paymentRecordId)
        recFail.set('status', 'failed')
        $app.save(recFail)
      } catch (_) {}
      throw new ApiError(502, 'Erro do servidor ao processar o pagamento. Tente novamente.')
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      var rawFail = ''
      if (res.raw) {
        rawFail = String(res.raw)
      } else if (res.body) {
        try {
          rawFail = String.fromCharCode.apply(null, new Uint8Array(res.body))
        } catch (_) {
          rawFail = String(res.body)
        }
      }
      // Nunca logar o corpo bruto (pode ecoar dados do pagador); só o status.
      console.error('[ipag-pay] iPag recusou o pagamento, status=' + res.statusCode)

      // Razão real do iPag, sanitizada (sem cartão/CVV/credenciais).
      var reason = ''
      try {
        var errData = JSON.parse(rawFail)
        var errMsg = errData.message || ''
        if (typeof errMsg === 'string' && errMsg.trim()) {
          reason = errMsg
        } else if (errMsg && typeof errMsg === 'object') {
          var parts = []
          for (var fk in errMsg) {
            if (
              Object.prototype.hasOwnProperty.call(errMsg, fk) &&
              errMsg[fk] &&
              errMsg[fk].length
            ) {
              for (var pj = 0; pj < errMsg[fk].length; pj++) {
                parts.push(String(errMsg[fk][pj]))
              }
            }
          }
          reason = parts.join('; ')
        }
      } catch (_) {}
      reason = String(reason || '')
        .replace(/\d{12,}/g, function (m) {
          return '****' + m.slice(-4)
        })
        .replace(/[`'\"]\s*\d{3,4}\s*[`'\"]/g, '`****`')
        .replace(/\b\d{3,4}\b/g, '****')
        .trim()
      if (apiKey) {
        reason = reason.split(apiKey).join('****')
      }

      try {
        var recRefused = $app.findRecordById('payments', paymentRecordId)
        recRefused.set('status', 'failed')
        $app.save(recRefused)
      } catch (_) {}
      throw new ApiError(402, reason || 'Pagamento recusado, tente outro cartão.')
    }

    var data = res.json || {}
    var attributes = data.attributes || data
    var rawStatus = ''
    if (attributes.status && typeof attributes.status === 'object' && attributes.status.message) {
      rawStatus = attributes.status.message
    } else if (attributes.status != null) {
      rawStatus = String(attributes.status)
    }
    var mappedStatus = mapStatus(rawStatus)
    var ipagUuid = data.uuid || attributes.uuid || ''

    try {
      var recOk = $app.findRecordById('payments', paymentRecordId)
      recOk.set('status', mappedStatus)
      if (ipagUuid) {
        recOk.set('ipag_id', ipagUuid)
      }
      $app.save(recOk)
    } catch (updErr) {
      $app
        .logger()
        .error(
          'Failed to update payment record',
          'recordId',
          paymentRecordId,
          'error',
          updErr.message,
        )
    }

    if (mappedStatus === 'failed') {
      throw new ApiError(402, 'Pagamento recusado, tente outro cartão.')
    }
    if (mappedStatus === 'pending') {
      return e.json(200, {
        status: 'pending',
        payment_id: paymentRecordId,
        message: 'Pagamento em processamento.',
      })
    }

    return e.json(200, {
      status: 'approved',
      payment_id: paymentRecordId,
      transaction_id: ipagUuid,
      message: 'Pagamento processado com sucesso via iPag.',
    })
  },
  $apis.requireAuth(),
)
