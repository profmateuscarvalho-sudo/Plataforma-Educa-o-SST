// ---------------------------------------------------------------------------
// BLOCO 4 — Hook de DIAGNÓSTICO da venda avulsa da revista (temporário, QA).
// Valida em runtime, sem cobrança real do iPag:
//   1. preços de magazine_landing_page (mês x anteriores) lidos no servidor;
//   2. qual revista é a "edição do mês" (publicada mais recente) e o preço
//      que o ramo 'magazine' cobraria de cada edição;
//   3. cria (ou reutiliza) um usuário de teste e um payment 'paid'
//      product_type='magazine' + magazine_id, e confere a MESMA condição que
//      access_guard.js usa para liberar fliphtml5_link/embed_code.
// Toda a lógica fica DENTRO do callback (regra da JSVM do PocketBase);
// sem imports npm — apenas globais $app/console.
// ---------------------------------------------------------------------------
routerAdd('GET', '/backend/v1/magazine-diag', (e) => {
  var out = {}

  // 1. Preços da landing page (mesma leitura de magazine_lib.js)
  var cur = 29.9
  var prev = 14.9
  try {
    var lp = $app.findRecordsByFilter('magazine_landing_page', '', '-created', 1, 0)
    if (lp.length > 0) {
      cur = Number(lp[0].get('current_issue_price') || 0) || cur
      prev = Number(lp[0].get('previous_issue_price') || 0) || prev
    }
  } catch (err) {
    console.warn('[magazine-diag] landing_page: ' + err.message)
  }
  out.precos = { current_issue_price: cur, previous_issue_price: prev }

  // 2. Edição do mês + preço por edição (mesma lógica de magazine_lib.js)
  var mags = $app.findRecordsByFilter('magazines', '', '-created', 10, 0)
  var latestId = mags.length > 0 ? mags[0].id : ''
  out.edicao_do_mes_id = latestId
  var perMag = []
  for (var i = 0; i < mags.length; i++) {
    var isCurrent = mags[i].id === latestId
    perMag.push({
      id: mags[i].id,
      title: mags[i].getString('title'),
      created: mags[i].getString('created'),
      preco_cobrado_no_servidor: isCurrent ? cur : prev,
      is_edicao_do_mes: isCurrent,
    })
  }
  out.edicoes = perMag

  // 3. Usuário + payment de teste (idempotente: reutiliza se já existir)
  var testEmail = 'qa-magazine@test.educacaosst.com.br'
  var testUser = null
  try {
    testUser = $app.findAuthRecordByEmail('users', testEmail)
    console.log('[magazine-diag] usuário de teste reutilizado: ' + testUser.id)
  } catch (_) {
    var usersCol = $app.findCollectionByNameOrId('users')
    testUser = new Record(usersCol)
    testUser.set('email', testEmail)
    testUser.set('name', 'QA Magazine Test')
    testUser.set('password', 'QaMagTest123!')
    testUser.set('passwordConfirm', 'QaMagTest123!')
    testUser.set('email_verificado', true)
    $app.save(testUser)
    console.log('[magazine-diag] usuário de teste criado: ' + testUser.id)
  }
  out.test_user = { id: testUser.id, email: testEmail }

  var paidMag = mags.length > 0 ? mags[0] : null
  if (!paidMag) {
    return e.json(500, { error: 'nenhuma revista no banco', diagnostico: out })
  }

  var testPayment = null
  try {
    testPayment = $app.findFirstRecordByFilter(
      'payments',
      "user = '" + testUser.id + "' && product_type = 'magazine' && status = 'paid'",
    )
    console.log('[magazine-diag] payment de teste reutilizado: ' + testPayment.id)
  } catch (_) {
    var payCol = $app.findCollectionByNameOrId('payments')
    testPayment = new Record(payCol)
    testPayment.set('user', testUser.id)
    testPayment.set('product_type', 'magazine')
    testPayment.set('magazine_id', paidMag.id)
    testPayment.set('status', 'paid')
    testPayment.set('amount', cur)
    testPayment.set('billing_cycle', 'monthly')
    testPayment.set('description', 'QA diag — compra avulsa revista (teste, sem iPag)')
    $app.save(testPayment)
    console.log('[magazine-diag] payment de teste criado: ' + testPayment.id)
  }
  out.test_payment = {
    id: testPayment.id,
    status: testPayment.getString('status'),
    product_type: testPayment.getString('product_type'),
    magazine_id: testPayment.getString('magazine_id'),
    amount: testPayment.getFloat('amount'),
  }

  // 4. Condição da guarda (a MESMA consulta que access_guard.js usa) para:
  //    a) a edição COMPRADA  → deve ter payment 'paid' correspondente
  //    b) as OUTRAS edições  → NÃO deve ter
  function hasPaidFor(magId) {
    try {
      $app.findFirstRecordByFilter(
        'payments',
        "user = '" +
          testUser.id +
          "' && status = 'paid' && product_type = 'magazine' && magazine_id = '" +
          magId +
          "'",
      )
      return true
    } catch (_) {
      return false
    }
  }
  var guard = []
  for (var j = 0; j < mags.length; j++) {
    guard.push({
      id: mags[j].id,
      title: mags[j].getString('title'),
      guarda_libera_link: hasPaidFor(mags[j].id),
    })
  }
  out.guarda_por_edicao = guard

  console.log('[magazine-diag] OK — ' + JSON.stringify(out))
  return e.json(200, out)
})
