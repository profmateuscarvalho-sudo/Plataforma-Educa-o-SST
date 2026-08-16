// Registra automaticamente o histórico de mudanças de etapa de oportunidades.
// - On create: registra a etapa inicial (etapa_anterior vazia).
// - On update quando a etapa muda: registra etapa_anterior e etapa_nova.

onRecordAfterCreateSuccess((e) => {
  var etapa = e.record.getString('etapa')
  if (!etapa) etapa = 'Cadastro'
  try {
    var col = $app.findCollectionByNameOrId('etapa_historico')
    var rec = new Record(col)
    rec.set('oportunidade_id', e.record.id)
    rec.set('etapa_anterior', '')
    rec.set('etapa_nova', etapa)
    $app.save(rec)
  } catch (err) {
    $app
      .logger()
      .error(
        'comercial: falha ao registrar historico de etapa (create)',
        'oportunidade',
        e.record.id,
        'error',
        err.message,
      )
  }
  return e.next()
}, 'oportunidades')

onRecordAfterUpdateSuccess((e) => {
  var nova = e.record.getString('etapa')
  var antiga = e.record.original().getString('etapa')
  if (nova === antiga) return e.next()
  try {
    var col = $app.findCollectionByNameOrId('etapa_historico')
    var rec = new Record(col)
    rec.set('oportunidade_id', e.record.id)
    rec.set('etapa_anterior', antiga)
    rec.set('etapa_nova', nova)
    $app.save(rec)
  } catch (err) {
    $app
      .logger()
      .error(
        'comercial: falha ao registrar historico de etapa (update)',
        'oportunidade',
        e.record.id,
        'error',
        err.message,
      )
  }
  return e.next()
}, 'oportunidades')
