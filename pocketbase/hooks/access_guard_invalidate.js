// ---------------------------------------------------------------------------
// Invalidação do cache de acesso do access_guard.js.
//
// O access_guard.js mantém em $app.store() (chave access:<userId>, TTL 60s) o
// tier efetivo e os ids de cursos/revistas com pagamento 'paid' do usuário.
// Quando um pagamento vira 'paid' ou uma assinatura muda de status/plano, o
// cache de 60s mostraria o acesso novo só depois de expirar — aqui limpamos a
// chave na hora.
//
// IMPORTANTE (limitação da JSVM desta plataforma): callbacks executam em pool
// separado — NÃO referencie declarações top-level dentro deles. Cada callback
// declara sua própria função de invalidação (nada de dependência entre hooks).
// ---------------------------------------------------------------------------

// payments: quando o status MUDA e passa a ser 'paid' (compra de curso,
// revista ou assinatura paga) — limpa o contexto do dono do pagamento.
onRecordAfterUpdateSuccess((e) => {
  function limparCacheDe(userId) {
    try {
      var st = $app.store()
      if (userId) st.remove('access:' + userId)
      else st.removeAll()
    } catch (err) {
      console.warn('[access_guard] falha ao invalidar cache: ' + (err && err.message))
    }
  }
  var rec = e.record
  if (!rec) return e.next()
  try {
    if (rec.collection().name !== 'payments') return e.next()
  } catch (_) {
    return e.next()
  }
  var newStatus = ''
  var oldStatus = ''
  try {
    newStatus = String(rec.getString('status') || '')
  } catch (_) {}
  try {
    oldStatus = String(rec.original().getString('status') || '')
  } catch (_) {}
  if (newStatus === 'paid' && oldStatus !== 'paid') {
    var userId = ''
    try {
      userId = String(rec.getString('user') || '')
    } catch (_) {}
    limparCacheDe(userId)
  }
  return e.next()
}, 'payments')

// payments: pagamento criado já como 'paid' (raro, mas possível).
onRecordAfterCreateSuccess((e) => {
  function limparCacheDe(userId) {
    try {
      var st = $app.store()
      if (userId) st.remove('access:' + userId)
      else st.removeAll()
    } catch (err) {
      console.warn('[access_guard] falha ao invalidar cache: ' + (err && err.message))
    }
  }
  var rec = e.record
  if (!rec) return e.next()
  var status = ''
  try {
    status = String(rec.getString('status') || '')
  } catch (_) {}
  if (status === 'paid') {
    var userId = ''
    try {
      userId = String(rec.getString('user') || '')
    } catch (_) {}
    limparCacheDe(userId)
  }
  return e.next()
}, 'payments')

// subscriptions: qualquer mudança de status ou de plano (ativação, upgrade,
// desativação) — o tier efetivo vem da assinatura active.
onRecordAfterUpdateSuccess((e) => {
  function limparCacheDe(userId) {
    try {
      var st = $app.store()
      if (userId) st.remove('access:' + userId)
      else st.removeAll()
    } catch (err) {
      console.warn('[access_guard] falha ao invalidar cache: ' + (err && err.message))
    }
  }
  var rec = e.record
  if (!rec) return e.next()
  var old = null
  try {
    old = rec.original()
  } catch (_) {}
  var statusChanged = false
  var planChanged = false
  try {
    statusChanged = String(rec.getString('status') || '') !== String(old.getString('status') || '')
  } catch (_) {}
  try {
    planChanged = String(rec.getString('plan') || '') !== String(old.getString('plan') || '')
  } catch (_) {}
  if (statusChanged || planChanged) {
    var userId = ''
    try {
      userId = String(rec.getString('user') || '')
    } catch (_) {}
    limparCacheDe(userId)
  }
  return e.next()
}, 'subscriptions')

onRecordAfterCreateSuccess((e) => {
  function limparCacheDe(userId) {
    try {
      var st = $app.store()
      if (userId) st.remove('access:' + userId)
      else st.removeAll()
    } catch (err) {
      console.warn('[access_guard] falha ao invalidar cache: ' + (err && err.message))
    }
  }
  var userId = ''
  try {
    userId = String(e.record.getString('user') || '')
  } catch (_) {}
  limparCacheDe(userId)
  return e.next()
}, 'subscriptions')

onRecordAfterDeleteSuccess((e) => {
  function limparCacheDe(userId) {
    try {
      var st = $app.store()
      if (userId) st.remove('access:' + userId)
      else st.removeAll()
    } catch (err) {
      console.warn('[access_guard] falha ao invalidar cache: ' + (err && err.message))
    }
  }
  var userId = ''
  try {
    userId = String(e.record.getString('user') || '')
  } catch (_) {}
  limparCacheDe(userId)
  return e.next()
}, 'subscriptions')
