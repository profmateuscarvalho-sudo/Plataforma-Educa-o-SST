// POST /backend/v1/create-payment — cobrança iPag (assinatura, curso avulso,
// mentoria avulsa) com valores SEMPRE recalculados no servidor.
//
// BLOCO 2: assinatura anual, parcelas 1-12, amount do frontend ignorado
// (pricing_lib.calacularPrecosDePlano).
// BLOCO 3: 30% de desconto em mentorias para Prata/Ouro, calculado AQUI;
// amount vindo do navegador ignorado.
//
// IMPORTANTE (limitação da JSVM desta plataforma): callbacks executam em pool
// separado — NÃO referencie declarações top-level dentro deles. Todo helper é
// declarado DENTRO do corpo do callback.
routerAdd(
  'POST',
  '/backend/v1/create-payment',
  (e) => {
    const body = e.requestInfo().body || {}
    const userId = e.auth ? e.auth.id : ''

    if (!userId) throw new UnauthorizedError('Sessão expirada. Faça login novamente para pagar.')

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

    // Verificação estrita para fluxo de assinatura:
    // product_type='subscription', plan_id e billing_cycle DEVEM ser fornecidos
    if (body.product_type === 'subscription' || body.plan_id || body.billing_cycle) {
      if (!body.product_type || body.product_type !== 'subscription') {
        throw new BadRequestError(
          "product_type deve ser 'subscription' para pagamentos de assinatura",
        )
      }
      if (!body.plan_id || typeof body.plan_id !== 'string' || body.plan_id.trim() === '') {
        throw new BadRequestError('plan_id é obrigatório para pagamentos de assinatura')
      }
      if (body.billing_cycle !== 'monthly' && body.billing_cycle !== 'yearly') {
        throw new BadRequestError(
          "billing_cycle deve ser 'monthly' ou 'yearly' para pagamentos de assinatura",
        )
      }
    }

    // BLOCO 2 — assinatura SEMPRE anual:
    // serverAmount declarado ANTES (era redeclarado depois e zerava o valor
    // calculado da assinatura, quebrando o checkout sem amount no body).
    var installments = 1
    var promoApplied = false
    var serverAmount = 0
    if (body.product_type === 'subscription') {
      // (e) força anual — 'monthly' continua aceito por compatibilidade do payload antigo
      body.billing_cycle = 'yearly'
      // valida parcelas (1-12) ANTES de qualquer cobrança
      var inst = Number(body.installments === undefined ? 1 : body.installments)
      if (!Number.isInteger(inst) || inst < 1 || inst > 12) {
        throw new BadRequestError(
          'Número de parcelas inválido. O parcelamento sem juros permite de 1 a 12 vezes.',
        )
      }
      installments = inst

      var planRec
      try {
        planRec = $app.findRecordById('subscription_plans', body.plan_id)
      } catch (planErr) {
        throw new NotFoundError('Plano de assinatura não encontrado.')
      }
      // (c) plano "Em breve" não pode ser comprado
      if (planRec.getBool && planRec.getBool('is_coming_soon')) {
        throw new BadRequestError(
          'Este plano ainda não está disponível para compra (Em breve). Escolha outro plano.',
        )
      }
      var planType = planRec.getString('type') || ''
      if (planType === 'coming_soon') {
        throw new BadRequestError(
          'Este plano ainda não está disponível para compra (Em breve). Escolha outro plano.',
        )
      }
      // (a) IGNORA body.amount — valor sempre recalculado no servidor.
      // INLINE OBRIGATÓRIO (JSVM): callbacks NÃO podem referenciar declarações
      // top-level de outros arquivos — `pricingLib` dava ReferenceError
      // ("pricingLib is not defined") e derrubava a rota com 500 para Pix E
      // cartão. Mesma lógica de pricing_lib.js / src/lib/pricing.ts:
      // cartão = parcela × 12; Pix = ceil(80% do total do cartão).
      function round2Inline(n) {
        return Math.round((n + Number.EPSILON) * 100) / 100
      }
      function precoDoPlano(plano) {
        var base = Math.max(0, Number(plano.get('price')) || 0)
        var installment = round2Inline(base)
        var yearlyCardTotal = round2Inline(installment * 12)
        var yearlyPixTotal = Math.ceil(yearlyCardTotal * 0.8)
        var out = {
          baseMonthly: round2Inline(base),
          referenceMonthly: round2Inline(base),
          installment: installment,
          yearlyCardTotal: yearlyCardTotal,
          yearlyPixTotal: yearlyPixTotal,
          monthlyPixEquivalent: round2Inline(yearlyPixTotal / 12),
          promoActive: false,
        }
        // Promoção vigente: só entra se ativa, dentro da validade e com
        // preço promocional > 0 (defensivo: plano com promo ligada e preço
        // zerado NUNCA pode virar cobrança de R$ 0,00).
        var promoActive = false
        try {
          promoActive = plano.getBool('promo_active')
        } catch (_) {}
        if (promoActive) {
          var nowSp = new Date(Date.now() - 3 * 60 * 60 * 1000)
          var promoEnds = null
          try {
            var rawEnds = plano.getString('promo_ends_at')
            if (rawEnds) {
              promoEnds = new Date(rawEnds)
              if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(String(rawEnds))) {
                // data "local" (sem fuso) interpretada como São Paulo (UTC-3)
                promoEnds = new Date(promoEnds.getTime() + 3 * 60 * 60 * 1000)
              }
            }
          } catch (_) {}
          var promoValid = true
          if (promoEnds && !isNaN(promoEnds.getTime()) && nowSp > promoEnds) promoValid = false
          var promoMonthly = 0
          try {
            promoMonthly = Number(plano.getFloat('promo_monthly_price')) || 0
          } catch (_) {}
          if (promoValid && promoMonthly > 0) {
            var pInstallment = round2Inline(promoMonthly)
            var pCard = round2Inline(pInstallment * 12)
            var pPix = Math.ceil(pCard * 0.8)
            out.baseMonthly = round2Inline(promoMonthly)
            out.installment = pInstallment
            out.yearlyCardTotal = pCard
            out.yearlyPixTotal = pPix
            out.monthlyPixEquivalent = round2Inline(pPix / 12)
            out.promoActive = true
          }
        }
        return out
      }
      var pricing = precoDoPlano(planRec)
      promoApplied = !!pricing.promoActive
      serverAmount = body.type === 'pix' ? pricing.yearlyPixTotal : pricing.yearlyCardTotal
      if (!(serverAmount > 0)) {
        throw new BadRequestError('Plano sem preço válido para assinatura.')
      }
      console.log(
        '[create-payment][subscription] plan=' +
          body.plan_id +
          ' type=' +
          body.type +
          ' installments=' +
          installments +
          ' promoApplied=' +
          promoApplied +
          ' serverAmount=' +
          serverAmount +
          ' (amount do frontend ignorado: ' +
          JSON.stringify(body.amount || null) +
          ')',
      )
    }

    // Preço resolvido no SERVIDOR a partir do cadastro (nunca confiar no amount
    // enviado pelo frontend) para compras avulsa de curso/mentoria.
    // Assinatura: amount já calculado acima via pricing_lib (body.amount ignorado).
    // BLOCO 4: revista avulsa — preço via magazine_lib (magazine_landing_page),
    // Pix SEM desconto de 20% (o desconto de Pix só vale para assinatura).
    if (body.product_type === 'magazine') {
      if (!body.magazine_id) {
        throw new BadRequestError('magazine_id é obrigatório para compra avulsa de revista')
      }
      try {
        $app.findRecordById('magazines', body.magazine_id)
      } catch (magErr) {
        throw new NotFoundError('Revista não encontrada.')
      }
      // INLINE OBRIGATÓRIO (JSVM): `magazineLib` (top-level de outro arquivo)
      // dava ReferenceError dentro do callback. Mesma lógica de
      // magazine_lib.js: edição do mês = revista mais recente; preços de
      // magazine_landing_page (atual 29.90 / anteriores 14.90 como fallback).
      var precoMag = (function () {
        function round2m(n) {
          return Math.round((n + Number.EPSILON) * 100) / 100
        }
        var latestId = ''
        try {
          var latest = $app.findRecordsByFilter('magazines', '', '-created', 1, 0)
          latestId = latest.length > 0 ? latest[0].id : ''
        } catch (_) {}
        var cur = 29.9
        var prev = 14.9
        try {
          var lp = $app.findRecordsByFilter('magazine_landing_page', '', '-created', 1, 0)
          if (lp.length > 0) {
            var c = Number(lp[0].get('current_issue_price')) || 0
            var p = Number(lp[0].get('previous_issue_price')) || 0
            if (c > 0) cur = c
            if (p > 0) prev = p
          }
        } catch (_) {}
        var isCurrent = !body.magazine_id || body.magazine_id === latestId
        var price = isCurrent ? cur : prev
        if (!(price > 0)) price = isCurrent ? 29.9 : 14.9
        return { price: round2m(price), isCurrent: isCurrent, latestId: latestId }
      })()
      serverAmount = precoMag.price
      console.log(
        '[create-payment][magazine] magazine_id=' +
          body.magazine_id +
          ' isCurrent=' +
          precoMag.isCurrent +
          ' type=' +
          body.type +
          ' serverAmount=' +
          serverAmount +
          ' (amount do frontend ignorado: ' +
          JSON.stringify(body.amount || null) +
          ')',
      )
    } else if (body.product_type === 'course' || body.product_type === 'mentorship') {
      if (body.product_type === 'course') {
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
      } else {
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
            '[create-payment][mentorship] desconto 30% (nivel ' +
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
      }
    } else if (body.product_type !== 'subscription') {
      if (!body.amount || body.amount <= 0) {
        throw new BadRequestError('Valor do pagamento inválido.')
      }
      serverAmount = body.amount
    }
    if (!body.customer || !body.customer.name) {
      throw new BadRequestError('Nome do titular é obrigatório.')
    }
    if (!body.customer || !body.customer.cpf_cnpj) {
      throw new BadRequestError('CPF é obrigatório para o pagamento.')
    }
    var cpfDigits = String(body.customer.cpf_cnpj).replace(/\D/g, '')
    // Validação completa com dígitos verificadores (módulo 11) — mesma regra do
    // frontend (src/lib/cpf.ts). Um CPF com 11 dígitos mas DV errado não passa.
    function cpfValido(cpf) {
      if (!/^\d{11}$/.test(cpf)) return false
      if (/^(\d)\1{10}$/.test(cpf)) return false
      var calc = function (base) {
        var soma = 0
        for (var i = 0; i < base.length; i++) soma += parseInt(base[i], 10) * (base.length + 1 - i)
        var r = (soma * 10) % 11
        return r === 10 ? 0 : r
      }
      if (calc(cpf.substring(0, 9)) !== parseInt(cpf[9], 10)) return false
      if (calc(cpf.substring(0, 10)) !== parseInt(cpf[10], 10)) return false
      return true
    }
    if (!cpfValido(cpfDigits)) {
      throw new BadRequestError(
        'CPF inválido. Confira os números digitados — o dígito verificador não bate.',
      )
    }
    body.customer.cpf_cnpj = cpfDigits
    if (body.type !== 'card' && body.type !== 'pix') {
      throw new BadRequestError("Forma de pagamento inválida (use 'pix' ou 'cartão').")
    }
    if (body.type === 'card') {
      if (!body.card || !body.card.method) {
        throw new BadRequestError('Dados do cartão ausentes para pagamento com cartão.')
      }
      if (body.card.token) {
        // Tokenized card: only token and method (and optional installments) are required
      } else {
        // Legacy card without token: full card data is required
        if (
          !body.card.holder ||
          !body.card.number ||
          !body.card.expiry_month ||
          !body.card.expiry_year ||
          !body.card.cvv
        ) {
          throw new BadRequestError(
            'Dados do cartão incompletos. Preencha nome do titular, número, validade e CVV.',
          )
        }
      }
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

    const callbackUrl =
      'https://educacao-sst-premium-969c2.shrd00.internal.goskip.dev/backend/v1/ipag-webhook'

    var fiveMinAgoDate = new Date(Date.now() - 5 * 60 * 1000)
    var fiveMinAgo = fiveMinAgoDate.toISOString().slice(0, 19).replace('T', ' ')
    var recentPayments
    try {
      recentPayments = $app.findRecordsByFilter(
        'payments',
        "user = '" + userId + "' && created >= '" + fiveMinAgo + "'",
        '-created',
        5,
        0,
      )
    } catch (cntErr) {
      recentPayments = []
    }
    if (recentPayments.length >= 5) {
      return e.json(429, {
        error: 'Muitas tentativas de pagamento. Aguarde alguns minutos e tente novamente.',
      })
    }

    const authString = apiId + ':' + apiKey
    let authBase64
    try {
      authBase64 = btoa(authString)
    } catch (_) {
      const bytes = []
      for (let i = 0; i < authString.length; i++) {
        bytes.push(authString.charCodeAt(i))
      }
      authBase64 = String.fromCharCode.apply(null, bytes)
    }

    var paymentRecord = null
    var paymentRecordId = ''

    try {
      var paymentsCol = $app.findCollectionByNameOrId('payments')
      paymentRecord = new Record(paymentsCol)
      paymentRecord.set('user', userId)
      paymentRecord.set('amount', serverAmount)
      paymentRecord.set('status', 'pending')

      if (body.product_type === 'subscription') {
        paymentRecord.set('product_type', 'subscription')
        paymentRecord.set('plan_id', body.plan_id)
        paymentRecord.set('billing_cycle', body.billing_cycle)
      } else {
        paymentRecord.set('product_type', body.product_type || '')
        if (body.plan_id) {
          paymentRecord.set('plan_id', body.plan_id)
        }
        if (body.billing_cycle) {
          paymentRecord.set('billing_cycle', body.billing_cycle)
        }
      }

      if (body.product_type === 'subscription') {
        // BLOCO 2 — relatório: parcelas escolhidas e se o valor usou promoção
        paymentRecord.set('installments', installments)
        paymentRecord.set('promo_applied', promoApplied)
      }

      if (body.product_type === 'course' && body.course_id) {
        paymentRecord.set('course_id', body.course_id)
      }
      // BLOCO 4 — grava a edição comprada (access_guard libera por este vínculo)
      if (body.product_type === 'magazine' && body.magazine_id) {
        paymentRecord.set('magazine_id', body.magazine_id)
      }
      if (body.mentorship_id) {
        paymentRecord.set('mentorship_id', body.mentorship_id)
      }
      if (body.selected_slots) {
        paymentRecord.set('selected_slots', body.selected_slots)
      }
      $app.save(paymentRecord)
      paymentRecordId = paymentRecord.id
    } catch (err) {
      console.error('[create-payment] falha ao salvar payments: ' + err.message)
      return e.json(500, { error: 'Erro do servidor ao registrar o pagamento. Tente novamente.' })
    }

    var paymentData = {
      amount: serverAmount,
      order_id: paymentRecordId,
      callback_url: callbackUrl,
      customer: body.customer,
    }

    if (body.type === 'card') {
      paymentData.payment = {
        type: 'card',
        method: body.card.method,
        capture: true,
        installments:
          body.product_type === 'subscription' ? installments : body.card.installments || 1,
        card: body.card.token
          ? {
              token: body.card.token,
            }
          : {
              holder: body.card.holder,
              number: body.card.number,
              expiry_month: body.card.expiry_month,
              expiry_year: body.card.expiry_year,
              cvv: body.card.cvv,
            },
      }
    } else if (body.type === 'pix') {
      paymentData.payment = {
        type: 'pix',
        method: 'pix',
      }
    }

    function mapStatus(rawStatus) {
      if (!rawStatus) return 'pending'
      var upper = rawStatus.toUpperCase()
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

    function updatePaymentStatus(recordId, status, ipagId) {
      try {
        var rec = $app.findRecordById('payments', recordId)
        rec.set('status', status)
        if (ipagId) {
          rec.set('ipag_id', ipagId)
        }
        $app.save(rec)
      } catch (updErr) {
        console.error(
          '[create-payment] falha ao atualizar payments: ' + recordId + ' ' + updErr.message,
        )
      }
    }

    // Log do payload exato que será enviado ao iPag (mascarando dados ultra-sensíveis de cartão se houver)
    var loggedPayload = JSON.parse(JSON.stringify(paymentData))
    if (loggedPayload.payment && loggedPayload.payment.card && loggedPayload.payment.card.cvv) {
      loggedPayload.payment.card.cvv = '***'
    }
    if (loggedPayload.payment && loggedPayload.payment.card && loggedPayload.payment.card.number) {
      loggedPayload.payment.card.number =
        loggedPayload.payment.card.number.slice(0, 6) +
        '******' +
        loggedPayload.payment.card.number.slice(-4)
    }
    console.log('[DEBUG_IPAG_PAYLOAD_SENT] ' + JSON.stringify(loggedPayload))

    var tIpagStart = Date.now()
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
    } catch (err) {
      var tIpagErr = Date.now() - tIpagStart
      console.log('[DEBUG_IPAG_HTTP_ERROR] duration=' + tIpagErr + 'ms error=' + err.message)
      console.error('[create-payment] falha de conexão com iPag: ' + err.message)
      updatePaymentStatus(paymentRecordId, 'failed', '')
      return e.json(502, {
        error: 'Erro de conexão com o gateway de pagamento. Tente novamente em instantes.',
      })
    }

    var tIpagDuration = Date.now() - tIpagStart
    console.log(
      '[DEBUG_IPAG_RESPONSE_STATUS] status=' + res.statusCode + ' duration=' + tIpagDuration + 'ms',
    )

    if (res.statusCode < 200 || res.statusCode >= 300) {
      var rawBodyString = ''
      if (res.raw) {
        rawBodyString = String(res.raw)
      } else if (res.body) {
        try {
          rawBodyString = String.fromCharCode.apply(null, new Uint8Array(res.body))
        } catch (_) {
          rawBodyString = String(res.body)
        }
      }
      var errorBody = res.json || rawBodyString || 'Unknown error'
      // O corpo do iPag ECOA valores enviados (ex.: CVV entre crases) — nunca
      // logar nem devolver o corpo bruto/payload ao frontend.
      console.error('[create-payment] iPag retornou erro, status=' + res.statusCode)
      updatePaymentStatus(paymentRecordId, 'failed', '')
      var razao = ''
      try {
        var errJson = typeof errorBody === 'object' ? errorBody : JSON.parse(rawBodyString || '{}')
        var em =
          (errJson && (errJson.message || (errJson.attributes && errJson.attributes.message))) || ''
        if (typeof em === 'string' && em.trim()) {
          razao = em
        } else if (em && typeof em === 'object') {
          var parts = []
          for (var fk in em) {
            if (Object.prototype.hasOwnProperty.call(em, fk) && em[fk] && em[fk].length) {
              for (var pj = 0; pj < em[fk].length; pj++) parts.push(String(em[fk][pj]))
            }
          }
          razao = parts.join('; ')
        }
      } catch (_) {}
      razao = String(razao || '')
        .replace(/[`'\"]\s*\d{3,4}\s*[`'\"]/g, '`****`')
        .replace(/\b\d{3,4}\b/g, '****')
        .trim()
      if (apiKey) razao = razao.split(apiKey).join('****')
      return e.json(res.statusCode, {
        error:
          razao ||
          'Pagamento não autorizado no momento. Tente novamente ou use outra forma de pagamento.',
        status: res.statusCode,
      })
    }

    var data
    try {
      data = res.json
    } catch (err) {
      updatePaymentStatus(paymentRecordId, 'failed', '')
      return e.json(500, {
        error: 'Resposta inválida do gateway de pagamento. Tente novamente em instantes.',
      })
    }

    var ipagUuid = data.uuid || ''
    var attributes = data.attributes || data
    var rawStatus = ''
    if (attributes.status && typeof attributes.status === 'object' && attributes.status.message) {
      rawStatus = attributes.status.message
    } else if (attributes.status != null) {
      rawStatus = String(attributes.status)
    }

    var mappedStatus = mapStatus(rawStatus)

    updatePaymentStatus(paymentRecordId, mappedStatus, ipagUuid)

    var response = {
      payment_id: paymentRecordId,
      ipag_id: ipagUuid,
      status: mappedStatus,
    }

    if (body.type === 'pix' && attributes.pix) {
      response.pix = {
        qrcode: attributes.pix.qrcode,
        qrcode64: attributes.pix.qrcode64,
        link: attributes.pix.link || attributes.link,
      }
    }

    return e.json(200, response)
  },
  $apis.requireAuth(),
)
