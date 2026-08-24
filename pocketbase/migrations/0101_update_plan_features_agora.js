migrate(
  (app) => {
    try {
      const plans = app.findRecordsByFilter(
        'subscription_plans',
        'name ~ "Free"',
        '-created',
        10,
        0,
      )
      for (let i = 0; i < plans.length; i++) {
        const plan = plans[i]
        let features = plan.get('features')
        if (typeof features === 'string') {
          try {
            features = JSON.parse(features)
          } catch (_) {}
        }
        if (Array.isArray(features)) {
          const updated = features.map((f) => (f === 'Feed de Cases' ? 'Ágora de Debates' : f))
          plan.set('features', updated)
          app.save(plan)
        }
      }
    } catch (err) {
      console.log('Error updating subscription plans features:', err)
    }
  },
  (app) => {},
)
