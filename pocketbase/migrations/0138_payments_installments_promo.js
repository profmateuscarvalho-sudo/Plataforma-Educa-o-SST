// BLOCO 2 — REESTRUTURAÇÃO DOS PLANOS (checkout anual):
// campos de relatório em payments.
//
// - installments  (number): parcelamento escolhido no cartão (1-12, sem juros).
// - promo_applied (bool): se o valor cobrado usou o preço promocional do plano.
//
// Idempotente: só adiciona cada campo se ele ainda não existir.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payments')
    let changed = false
    if (!col.fields.getByName('installments')) {
      col.fields.add(new NumberField({ name: 'installments', onlyInt: true, min: 1, max: 12 }))
      changed = true
    }
    if (!col.fields.getByName('promo_applied')) {
      col.fields.add(new BoolField({ name: 'promo_applied' }))
      changed = true
    }
    if (changed) {
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('payments')
    for (const f of ['installments', 'promo_applied']) {
      const field = col.fields.getByName(f)
      if (field) {
        col.fields.removeByName(f)
      }
    }
    app.save(col)
  },
)
