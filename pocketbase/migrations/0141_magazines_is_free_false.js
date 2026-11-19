// ---------------------------------------------------------------------------
// 0141 — magazines.is_free = false em TODAS as edições.
//
// Diagnóstico do bug de acesso: todas as revistas estavam is_free=true, então a
// guarda do servidor (access_guard) entregava fliphtml5_link/embed_code até
// para contas Free. Como a coleção de dados é semeada no ambiente real, o
// ajuste é um BACKFILL DE DADOS idempotente (no-op em banco vazio), não uma
// mudança de schema. O padrão para NOVAS revistas no admin nasce false.
// ---------------------------------------------------------------------------
migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('magazines')
    var records = app.findRecordsByFilter(col.id, 'is_free = true', '', 500, 0)
    for (var i = 0; i < records.length; i++) {
      records[i].set('is_free', false)
      app.save(records[i])
    }
    console.log('[0141] magazines is_free=false aplicado: ' + records.length + ' edições ajustadas')
  },
  (app) => {
    // down: reverte apenas o que o up alterou (idempotente, no-op em banco vazio)
    var col = app.findCollectionByNameOrId('magazines')
    var records = app.findRecordsByFilter(col.id, 'is_free = false', '', 500, 0)
    for (var i = 0; i < records.length; i++) {
      records[i].set('is_free', true)
      app.save(records[i])
    }
  },
)
