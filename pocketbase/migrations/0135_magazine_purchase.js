// BLOCO 4 — Venda avulsa da revista.
//
// 1) payments.magazine_id: relation → magazines, opcional. Identifica a edição
//    comprada em compras avulsas (Pix ou cartão), mesma lógica do course_id
//    (migração 0134). Idempotente: só adiciona se ainda não existir.
// 2) magazine_landing_page: coleção existente (hoje sem uso, só histórico).
//    Reutilizada para guardar os PREÇOS CONFIGURÁVEIS da venda avulsa:
//      - current_issue_price   (Edição do mês,     padrão 29.90)
//      - previous_issue_price  (Edições anteriores, padrão 14.90)
//    Migração adiciona APENAS esses dois campos — nada é apagado.
//    "Edição do mês" = a edição publicada mais recente de magazines; calculado
//    dinamicamente no servidor (revistaLib.precoDaEdicao) — quando sai edição
//    nova, a anterior passa automaticamente ao preço de edição anterior.
migrate(
  (app) => {
    // --- payments.magazine_id ---
    const paymentsCol = app.findCollectionByNameOrId('payments')
    if (!paymentsCol.fields.getByName('magazine_id')) {
      paymentsCol.fields.add(
        new RelationField({
          name: 'magazine_id',
          collectionId: app.findCollectionByNameOrId('magazines').id,
          cascadeDelete: false,
          minSelect: 0,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(paymentsCol)
    }

    // --- magazine_landing_page: campos de preço (sem apagar nada) ---
    const col = app.findCollectionByNameOrId('magazine_landing_page')
    let changed = false
    if (!col.fields.getByName('current_issue_price')) {
      col.fields.add(
        new NumberField({
          name: 'current_issue_price',
          onlyInt: false,
          min: 0,
        }),
      )
      changed = true
    }
    if (!col.fields.getByName('previous_issue_price')) {
      col.fields.add(
        new NumberField({
          name: 'previous_issue_price',
          onlyInt: false,
          min: 0,
        }),
      )
      changed = true
    }
    if (changed) app.save(col)

    // --- seed: um único registro de configuração com os preços padrão ---
    const existing = app.findRecordsByFilter('magazine_landing_page', '', '-created', 1, 0)
    if (existing.length === 0) {
      const settingsCol = app.findCollectionByNameOrId('magazine_landing_page')
      const settings = new Record(settingsCol)
      settings.set('current_issue_price', 29.9)
      settings.set('previous_issue_price', 14.9)
      app.save(settings)
      console.log('[0135] magazine_landing_page criada com preços padrão (29.90 / 14.90)')
    }
  },
  (app) => {
    // Reverso: remove apenas os campos adicionados nesta migração.
    const paymentsCol = app.findCollectionByNameOrId('payments')
    if (paymentsCol.fields.getByName('magazine_id')) {
      paymentsCol.fields.removeByName('magazine_id')
      app.save(paymentsCol)
    }
    const col = app.findCollectionByNameOrId('magazine_landing_page')
    let changed = false
    if (col.fields.getByName('current_issue_price')) {
      col.fields.removeByName('current_issue_price')
      changed = true
    }
    if (col.fields.getByName('previous_issue_price')) {
      col.fields.removeByName('previous_issue_price')
      changed = true
    }
    if (changed) app.save(col)
  },
)
