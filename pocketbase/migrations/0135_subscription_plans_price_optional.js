// Torna "price" de subscription_plans não obrigatório (PocketBase recusa 0 em
// number required, o que impedia salvar o plano Free) e corrige registros
// existentes cujo campo "features" (json) foi gravado como string JSON.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('subscription_plans')

    // 1. price deixa de ser required
    const price = col.fields.getByName('price')
    if (price) {
      price.required = false
    }

    // 2. Corrige registros com features gravadas como texto (JSON.stringify)
    const records = app.findRecordsByFilter('subscription_plans', '', '', 0, 0)
    for (const r of records) {
      const raw = r.getString('features')
      if (raw === '') {
        r.set('features', [])
        app.save(r)
        continue
      }
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          r.set('features', parsed)
          app.save(r)
        }
      } catch (e) {
        // não é JSON válido — assume que já é array gravado; ignora
      }
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('subscription_plans')
    const price = col.fields.getByName('price')
    if (price) {
      price.required = true
    }
    app.save(col)
  },
)
