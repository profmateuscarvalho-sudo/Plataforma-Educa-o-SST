// Remove 'Ágora de Debates' do array `features` de cada registro de
// subscription_plans. Idempotente: no-op quando o item não existe (banco vazio
// ou planos já limpos). Os demais itens, preços e planos não são alterados.
migrate(
  (app) => {
    try {
      const plans = app.findRecordsByFilter('subscription_plans', 'id != ""', '-created', 0, 0)
      for (const plan of plans) {
        let features = plan.get('features')
        if (typeof features === 'string') {
          try {
            features = JSON.parse(features)
          } catch (_) {}
        }
        if (Array.isArray(features) && features.includes('Ágora de Debates')) {
          const filtered = features.filter((f) => f !== 'Ágora de Debates')
          plan.set('features', filtered)
          app.save(plan)
        }
      }
    } catch (err) {
      console.log('Error removing Ágora de Debates from subscription plans features:', err)
      throw err
    }
  },
  (app) => {},
)
