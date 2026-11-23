// ---------------------------------------------------------------------------
// ADMIN — PAINEL DE GESTÃO DE VENDAS E ASSINATURAS (Parte A)
//
// Rotas (somente admin; gate de papel DENTRO do handler):
//   GET  /backend/v1/admin/vendas              — tabela paginada + cards
//   GET  /backend/v1/admin/vendas?id=...       — detalhe do pagamento + e-mails
//   POST /backend/v1/admin/vendas/resend-email — reenvia e-mail de confirmação
//
// Filtros (query): periodo=este_mes|mes_passado|personalizado, start/end
// (AAAA-MM-DD, relógio SP), tipo=subscription|course|magazine|mentorship,
// status=paid|pending|failed, forma=pix|cartao, search (nome/e-mail), page.
//
// Tudo junto em POUCAS consultas: 1 busca paginada de payments + 1 de users +
// 1 por coleção de produto (planos/cursos/revistas/mentorias). NADA de
// consulta por linha. Cards com cache de 60s via $app.store().
//
// Observação: a coleção payments NÃO tem campo de forma de pagamento; a forma
// é derivada de installments (>1 ⇒ "Cartão Nx", caso contrário "Pix"/à vista).
//
// CONVENÇÃO JSVM: toda a lógica fica INLINE no callback — sem imports e sem
// declarações top-level no arquivo ("Hook scoping error").
// ---------------------------------------------------------------------------
routerAdd(
  'GET',
  '/backend/v1/admin/vendas',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores')
    }

    try {
      var q = e.request.url.query()

      // ---------- helpers (inline) ----------
      function dataBRcurta(iso) {
        if (!iso) return ''
        var ms = Date.parse(iso)
        if (isNaN(ms)) return ''
        var sp = new Date(ms + 3 * 3600 * 1000) // relógio SP (UTC-3)
        return (
          sp.toISOString().slice(8, 10) +
          '/' +
          sp.toISOString().slice(5, 7) +
          '/' +
          sp.toISOString().slice(0, 4)
        )
      }
      // Converte data SP (AAAA-MM-DD) para janela ISO UTC: 00:00 SP ⇒ 03:00 UTC;
      // fim do dia SP ⇒ 02:59:59 UTC do dia seguinte.
      function janelaIso(dateStr, fimDoDia) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return ''
        var p = dateStr.split('-')
        if (fimDoDia) {
          return new Date(
            Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]) + 1, 2, 59, 59),
          ).toISOString()
        }
        return new Date(
          Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 3, 0, 0),
        ).toISOString()
      }
      // Janela [início, fim] de um mês (1-12) no relógio SP, em ISO UTC.
      function janelaMes(ano, mes1) {
        var ini = new Date(Date.UTC(ano, mes1 - 1, 1, 3, 0, 0)).toISOString()
        var fim = new Date(Date.UTC(ano, mes1, 1, 2, 59, 59)).toISOString()
        return [ini, fim]
      }

      var TIPOS = {
        subscription: 'Assinatura',
        course: 'Curso',
        magazine: 'Revista',
        mentorship: 'Mentoria',
      }

      function formaLabel(installments) {
        var n = Number(installments || 0)
        return n > 1 ? 'Cartão ' + n + 'x' : 'Pix'
      }

      // ---------- modo detalhe: ?id=<payment id> ----------
      var detalheId = String(q.get('id') || '').trim()
      if (detalheId !== '') {
        var pay
        try {
          pay = $app.findRecordById('payments', detalheId)
        } catch (_) {
          return e.json(404, { error: 'Pagamento não encontrado' })
        }
        var uidD = String(pay.get('user') || '')
        var uD = null
        try {
          uD = $app.findRecordById('users', uidD)
        } catch (_) {}
        var itemD = montaItem(pay, uD ? { id: uidD, rec: uD } : null, {}, {}, {}, {})
        // Nome do produto no detalhe: resolve direto (1 consulta por coleção tocada)
        itemD.produto_nome = nomeProduto(pay) || itemD.produto_nome
        var emails = []
        if (uidD !== '') {
          var logsD = $app.findRecordsByFilter(
            'email_logs',
            "user = '" + uidD + "'",
            '-created',
            20,
            0,
          )
          for (var le = 0; le < logsD.length; le++) {
            var lg = logsD[le]
            emails.push({
              id: lg.id,
              email_type: lg.getString('email_type'),
              recipient_email: lg.getString('recipient_email'),
              recipient_name: lg.getString('recipient_name'),
              sent: lg.getBool('sent'),
              sent_at: lg.getString('sent_at'),
              error_message: lg.getString('error_message'),
              created: lg.getString('created'),
            })
          }
        }
        return e.json(200, { item: itemD, emails: emails })
      }

      // ---------- listagem paginada + filtros ----------
      var page = parseInt(q.get('page') || '1', 10)
      var perPage = parseInt(q.get('per_page') || '50', 10)
      if (isNaN(page) || page < 1) page = 1
      if (isNaN(perPage) || perPage < 1 || perPage > 200) perPage = 50

      var periodo = String(q.get('periodo') || 'este_mes').trim()
      var tipoF = String(q.get('tipo') || '').trim()
      var statusF = String(q.get('status') || '').trim()
      var formaF = String(q.get('forma') || '').trim()
      var search = String(q.get('search') || '')
        .trim()
        .replace(/["\\]/g, '')

      var partes = []
      // período
      if (periodo === 'este_mes' || periodo === 'mes_passado' || periodo === 'personalizado') {
        var iniIso = ''
        var fimIso = ''
        if (periodo === 'personalizado') {
          iniIso = janelaIso(String(q.get('start') || '').trim(), false)
          fimIso = janelaIso(String(q.get('end') || '').trim(), true)
        } else {
          var spNow = new Date(Date.now() - 3 * 3600 * 1000).toISOString() // parede SP
          var yA = Number(spNow.slice(0, 4))
          var mA = Number(spNow.slice(5, 7))
          var jan = periodo === 'este_mes' ? janelaMes(yA, mA) : janelaMes(yA, mA - 1)
          iniIso = jan[0]
          fimIso = jan[1]
        }
        if (iniIso !== '') partes.push("created >= '" + iniIso + "'")
        if (fimIso !== '') partes.push("created <= '" + fimIso + "'")
      }
      if (TIPOS[tipoF]) partes.push("product_type = '" + tipoF + "'")
      if (statusF === 'paid' || statusF === 'pending' || statusF === 'failed') {
        partes.push("status = '" + statusF + "'")
      }
      if (formaF === 'cartao') partes.push('installments > 1')
      if (formaF === 'pix') partes.push('installments <= 1')
      if (search !== '') {
        // Busca por nome/e-mail: resolve os usuários em UMA consulta e filtra
        // payments por user in (...). Nenhum usuário ⇒ página vazia.
        var usuariosAchados = $app.findRecordsByFilter(
          'users',
          '(name ~ "' + search + '" || email ~ "' + search + '")',
          '-created',
          100,
          0,
        )
        if (usuariosAchados.length === 0) {
          return e.json(200, {
            page: page,
            per_page: perPage,
            totalItems: 0,
            totalPages: 1,
            items: [],
            cards: calculaCards(),
          })
        }
        var partesU = []
        for (var iu = 0; iu < usuariosAchados.length; iu++)
          partesU.push('user = "' + usuariosAchados[iu].id + '"')
        // O parser de filtro do JSVM não tem operador "in" — usa cadeia OR.
        partes.push('(' + partesU.join(' || ') + ')')
      }

      var filtro = partes.join(' && ')
      // countRecords(col, string) lança TypeError no JSVM (só aceita $dbx.exp);
      // contagem paginada com o MESMO filtro PB das linhas — 0 registros ⇒ total 0.
      var total = 0
      for (;;) {
        var pgTotal = $app.findRecordsByFilter('payments', filtro, '-created', 500, total)
        total += pgTotal.length
        if (pgTotal.length < 500) break
      }
      var registros = $app.findRecordsByFilter(
        'payments',
        filtro,
        '-created',
        perPage,
        (page - 1) * perPage,
      )

      // ---------- mapas em lote (uma consulta por coleção) ----------
      var userIds = []
      var planIds = []
      var cursoIds = []
      var revIds = []
      var mentIds = []
      function coleta(rec, campo, lista) {
        var v = String(rec.get(campo) || '')
        if (v !== '' && lista.indexOf(v) === -1) lista.push(v)
      }
      for (var i0 = 0; i0 < registros.length; i0++) {
        coleta(registros[i0], 'user', userIds)
        coleta(registros[i0], 'plan_id', planIds)
        coleta(registros[i0], 'course_id', cursoIds)
        coleta(registros[i0], 'magazine_id', revIds)
        coleta(registros[i0], 'mentorship_id', mentIds)
      }

      function mapa(campo, ids) {
        var out = {}
        if (ids.length === 0) return out
        // O parser de filtro do JSVM não tem operador "in" — usa cadeia OR.
        var partesId = []
        for (var i = 0; i < ids.length; i++) partesId.push('id = "' + ids[i] + '"')
        var recs = $app.findRecordsByFilter(campo[0], '(' + partesId.join(' || ') + ')', '', 500, 0)
        for (var j = 0; j < recs.length; j++) out[recs[j].id] = recs[j]
        return out
      }
      var mapUsers = mapa(['users', 'name'], userIds)
      var mapPlanos = mapa(['subscription_plans', 'name'], planIds)
      var mapCursos = mapa(['courses', 'title'], cursoIds)
      var mapRevistas = mapa(['magazines', 'title'], revIds)
      var mapMentorias = mapa(['mentorships', 'title'], mentIds)

      var items = []
      for (var k = 0; k < registros.length; k++) {
        var upId = String(registros[k].get('user') || '')
        var urec = mapUsers[upId] || null
        var it = montaItem(
          registros[k],
          urec ? { id: upId, rec: urec } : null,
          mapPlanos,
          mapCursos,
          mapRevistas,
          mapMentorias,
        )
        items.push(it)
      }

      return e.json(200, {
        page: page,
        per_page: perPage,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
        items: items,
        cards: calculaCards(),
      })
    } catch (err) {
      // console.* é o que aparece no stream de hooks (não $app.logger())
      console.error('admin_vendas: falha na listagem:', err && err.message ? err.message : err)
      return e.json(500, { error: 'Erro ao carregar vendas' })
    }

    // ---------- montagem de um item de venda (definida no escopo do handler) ----------
    function nomeProduto(p) {
      var tipo = p.getString('product_type')
      try {
        if (tipo === 'subscription' && String(p.get('plan_id') || '') !== '') {
          return $app.findRecordById('subscription_plans', p.getString('plan_id')).getString('name')
        }
        if (tipo === 'course' && String(p.get('course_id') || '') !== '') {
          return $app.findRecordById('courses', p.getString('course_id')).getString('title')
        }
        if (tipo === 'magazine' && String(p.get('magazine_id') || '') !== '') {
          return $app.findRecordById('magazines', p.getString('magazine_id')).getString('title')
        }
        if (tipo === 'mentorship' && String(p.get('mentorship_id') || '') !== '') {
          return $app.findRecordById('mentorships', p.getString('mentorship_id')).getString('title')
        }
      } catch (_) {}
      return ''
    }

    function montaItem(p, userMap, mapPlanos, mapCursos, mapRevistas, mapMentorias) {
      var tipo = p.getString('product_type')
      var uid = String(p.get('user') || '')
      var nome = ''
      var email = ''
      var telefone = ''
      var contrato = ''
      if (userMap && userMap.rec) {
        nome = userMap.rec.getString('name')
        email = userMap.rec.getString('email')
        telefone = userMap.rec.getString('phone')
        contrato = userMap.rec.getString('contract_end_date')
      }
      // produto: nome pelo mapa em lote (listagem) — sem consulta por linha
      var pnome = ''
      if (tipo === 'subscription') {
        var pid = String(p.get('plan_id') || '')
        pnome = mapPlanos && mapPlanos[pid] ? mapPlanos[pid].getString('name') : ''
        var ciclo = p.getString('billing_cycle')
        if (pnome !== '' && (ciclo === 'yearly' || ciclo === 'monthly')) {
          pnome += ciclo === 'yearly' ? ' (Anual)' : ' (Mensal)'
        }
      } else if (tipo === 'course') {
        var cid = String(p.get('course_id') || '')
        pnome = mapCursos && mapCursos[cid] ? mapCursos[cid].getString('title') : ''
      } else if (tipo === 'magazine') {
        var mid = String(p.get('magazine_id') || '')
        pnome = mapRevistas && mapRevistas[mid] ? mapRevistas[mid].getString('title') : ''
      } else if (tipo === 'mentorship') {
        var mdid = String(p.get('mentorship_id') || '')
        pnome = mapMentorias && mapMentorias[mdid] ? mapMentorias[mdid].getString('title') : ''
      }

      // vencimento do acesso
      var venc = ''
      if (tipo === 'subscription') {
        venc = contrato ? dataBRcurta(contrato) : '—'
      } else if (tipo === 'course' || tipo === 'magazine') {
        venc = 'Vitalício'
      } else if (tipo === 'mentorship') {
        var slots = p.get('selected_slots')
        var primeiro = ''
        try {
          if (typeof slots === 'string' && slots !== '') slots = JSON.parse(slots)
          if (Array.isArray(slots) && slots.length > 0 && slots[0] && slots[0].date) {
            primeiro = slots[0].date + (slots[0].time ? ' ' + slots[0].time : '')
          }
        } catch (_) {}
        venc = primeiro !== '' ? primeiro : '—'
      } else {
        venc = '—'
      }

      return {
        id: p.id,
        created: p.getString('created'),
        amount: Number(p.get('amount') || 0),
        status: p.getString('status'),
        product_type: tipo,
        produto_tipo_label: TIPOS[tipo] || 'Outros',
        produto_nome: pnome,
        forma: formaLabel(p.get('installments')),
        installments: Number(p.get('installments') || 0),
        ipag_id: p.getString('ipag_id'),
        billing_cycle: p.getString('billing_cycle'),
        promo_applied: p.getBool('promo_applied'),
        user_id: uid,
        aluno: nome,
        email: email,
        telefone: telefone,
        vencimento: venc,
      }
    }

    // ---------- cards do topo (cache 60s em $app.store()) ----------
    function calculaCards() {
      var st = $app.store()
      var cached = st.get('admin_vendas_cards')
      if (cached && cached.at && Date.now() - cached.at < 60000) return cached.data

      var nowIso = new Date().toISOString()
      var spNow = new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      var yA = Number(spNow.slice(0, 4))
      var mA = Number(spNow.slice(5, 7))
      var jan = janelaMes(yA, mA)

      // receita do mês + nº de vendas no mês (loop paginado, só pagos)
      var receitaMes = 0
      var vendasMes = 0
      var off = 0
      for (;;) {
        var pg = $app.findRecordsByFilter(
          'payments',
          "status = 'paid' && created >= '" + jan[0] + "' && created <= '" + jan[1] + "'",
          '-created',
          500,
          off,
        )
        for (var a = 0; a < pg.length; a++) {
          receitaMes += Number(pg[a].get('amount') || 0)
          vendasMes++
        }
        if (pg.length < 500) break
        off += 500
      }
      // receita total (todos os pagos, histórico completo)
      var receitaTotal = 0
      off = 0
      for (;;) {
        var pgT = $app.findRecordsByFilter('payments', "status = 'paid'", '-created', 500, off)
        for (var b = 0; b < pgT.length; b++) receitaTotal += Number(pgT[b].get('amount') || 0)
        if (pgT.length < 500) break
        off += 500
      }
      var ticket = vendasMes > 0 ? Math.round((receitaMes / vendasMes) * 100) / 100 : 0

      // assinantes ativos: Prata/Ouro (planos pagos), assinatura ativa e
      // contract_end_date futura — usuários distintos, contas Free NÃO contam
      var assinantes = 0
      try {
        var planosPagos = $app.findRecordsByFilter(
          'subscription_plans',
          'price > 0 || price_yearly > 0',
          '',
          500,
          0,
        )
        if (planosPagos.length > 0) {
          var idsP = []
          for (var c = 0; c < planosPagos.length; c++) idsP.push('"' + planosPagos[c].id + '"')
          var partesP = []
          for (var cp = 0; cp < idsP.length; cp++) partesP.push('plan = ' + idsP[cp])
          var subs = $app.findRecordsByFilter(
            'subscriptions',
            "status = 'active' && (" + partesP.join(' || ') + ')',
            '',
            0,
            0,
          )
          var vistos = {}
          var idsAlunos = []
          for (var d = 0; d < subs.length; d++) {
            var su = String(subs[d].get('user') || '')
            if (su !== '' && !vistos[su]) {
              vistos[su] = true
              idsAlunos.push('"' + su + '"')
            }
          }
          // O parser de filtro do JSVM não tem operador "in" — usa cadeia OR.
          var partesAlunos = []
          for (var da = 0; da < idsAlunos.length; da++) partesAlunos.push('id = ' + idsAlunos[da])
          assinantes = $app.findRecordsByFilter(
            'users',
            "role = 'student' && contract_end_date > '" +
              nowIso +
              "' && (" +
              partesAlunos.join(' || ') +
              ')',
            '',
            0,
            0,
          ).length
        }
      } catch (_) {}

      // assinaturas vencendo em 30 dias (alunos pagos com contrato vigente)
      var em30Iso = new Date(Date.now() + 30 * 86400 * 1000).toISOString()
      var venc30 = $app.findRecordsByFilter(
        'users',
        "role = 'student' && (plan_tier = 'prata' || plan_tier = 'ouro')" +
          " && contract_end_date > '" +
          nowIso +
          "' && contract_end_date <= '" +
          em30Iso +
          "'",
        '',
        0,
        0,
      ).length

      // pagamentos pendentes
      var pendentes = $app.findRecordsByFilter('payments', "status = 'pending'", '', 0, 0).length

      var cards = {
        receita_mes: Math.round(receitaMes * 100) / 100,
        receita_total: Math.round(receitaTotal * 100) / 100,
        vendas_mes: vendasMes,
        ticket_medio: ticket,
        assinantes_ativos: assinantes,
        vencendo_30_dias: venc30,
        pagamentos_pendentes: pendentes,
      }
      st.set('admin_vendas_cards', { at: Date.now(), data: cards })
      return cards
    }
  },
  $apis.requireAuth(),
)

// ---------------------------------------------------------------------------
// POST /backend/v1/admin/vendas/resend-email — reenvia o e-mail de confirmação
// do pagamento (payment_confirmed) e registra em email_logs.
// ---------------------------------------------------------------------------
routerAdd(
  'POST',
  '/backend/v1/admin/vendas/resend-email',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores')
    }
    try {
      var body = e.requestInfo().body || {}
      var pid = String(body.payment_id || '').trim()
      if (pid === '') return e.json(400, { error: 'payment_id é obrigatório' })

      var pay
      try {
        pay = $app.findRecordById('payments', pid)
      } catch (_) {
        return e.json(404, { error: 'Pagamento não encontrado' })
      }
      var uid = String(pay.get('user') || '')
      var u = null
      try {
        u = $app.findRecordById('users', uid)
      } catch (_) {}
      var email = u ? u.getString('email') : ''
      var nome = u ? u.getString('name') : ''
      if (email === '') return e.json(400, { error: 'Pagamento sem e-mail do aluno' })

      var tipo = pay.getString('product_type')
      var produto = ''
      try {
        if (tipo === 'subscription' && String(pay.get('plan_id') || '') !== '') {
          produto = $app
            .findRecordById('subscription_plans', pay.getString('plan_id'))
            .getString('name')
        } else if (tipo === 'course' && String(pay.get('course_id') || '') !== '') {
          produto = $app.findRecordById('courses', pay.getString('course_id')).getString('title')
        } else if (tipo === 'magazine' && String(pay.get('magazine_id') || '') !== '') {
          produto = $app
            .findRecordById('magazines', pay.getString('magazine_id'))
            .getString('title')
        } else if (tipo === 'mentorship' && String(pay.get('mentorship_id') || '') !== '') {
          produto = $app
            .findRecordById('mentorships', pay.getString('mentorship_id'))
            .getString('title')
        }
      } catch (_) {}
      if (produto === '') produto = 'Compra na Educação SST'
      var valor = Number(pay.get('amount') || 0)
        .toFixed(2)
        .replace('.', ',')

      var assunto = 'Confirmação de pagamento — Educação SST'
      var html =
        '<p>Olá ' +
        (nome || 'aluno') +
        ',</p>' +
        '<p>Confirmamos o pagamento de <strong>R$ ' +
        valor +
        '</strong> referente a <strong>' +
        produto +
        '</strong>.</p>' +
        '<p>Bom estudo!<br/>Equipe Educação SST</p>'

      var enviado = false
      var erroMsg = ''
      // Envio pela Brevo (mesmo padrão dos demais hooks de e-mail do projeto).
      var apiKey = $secrets.get('BREVO_API_KEY')
      if (!apiKey) {
        erroMsg = 'BREVO_API_KEY não configurado'
      } else {
        try {
          var emailRes = $http.send({
            url: 'https://api.brevo.com/v3/smtp/email',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
            body: JSON.stringify({
              sender: { name: 'Educação SST', email: 'assinante@educacaosst.com.br' },
              to: [{ email: email, name: nome }],
              subject: assunto,
              htmlContent: html,
            }),
            timeout: 10,
          })
          if (emailRes.statusCode >= 200 && emailRes.statusCode < 300) {
            enviado = true
          } else {
            erroMsg =
              'HTTP ' +
              emailRes.statusCode +
              ': ' +
              (emailRes.body
                ? String.fromCharCode.apply(null, new Uint8Array(emailRes.body))
                : 'sem corpo')
          }
        } catch (mailErr) {
          erroMsg = String(mailErr && mailErr.message ? mailErr.message : mailErr)
        }
      }

      // registra o reenvio em email_logs
      try {
        var coll = $app.findCollectionByNameOrId('email_logs')
        var log = new Record(coll)
        log.set('recipient_email', email)
        log.set('recipient_name', nome)
        log.set('email_type', 'payment_confirmed')
        log.set('user', uid)
        log.set('sent', enviado)
        if (enviado) log.set('sent_at', new Date().toISOString())
        if (erroMsg !== '') log.set('error_message', erroMsg)
        $app.save(log)
      } catch (logErr) {
        $app.logger().error('admin_vendas: falha ao registrar email_log', 'error', logErr.message)
      }

      if (!enviado) {
        return e.json(500, { error: 'Falha ao enviar o e-mail: ' + erroMsg })
      }
      return e.json(200, { ok: true, email: email })
    } catch (err) {
      $app.logger().error('admin_vendas: falha no reenvio de e-mail', 'error', err.message)
      return e.json(500, { error: 'Erro ao reenviar e-mail de confirmação' })
    }
  },
  $apis.requireAuth(),
)
