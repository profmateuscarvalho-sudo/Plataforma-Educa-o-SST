migrate(
  (app) => {
    const plans = new Collection({
      name: 'subscription_plans',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'price', type: 'number', required: true },
        {
          name: 'interval',
          type: 'select',
          required: true,
          values: ['monthly', 'yearly'],
          maxSelect: 1,
        },
        { name: 'features', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(plans)

    const col = app.findCollectionByNameOrId('subscription_plans')

    try {
      app.findFirstRecordByData('subscription_plans', 'name', 'Plano Mensal')
    } catch (_) {
      const monthly = new Record(col)
      monthly.set('name', 'Plano Mensal')
      monthly.set('description', 'Acesso mensal a todos os cursos e materiais')
      monthly.set('price', 49.9)
      monthly.set('interval', 'monthly')
      monthly.set(
        'features',
        JSON.stringify([
          'Acesso a todos os cursos',
          'Materiais de apoio',
          'Certificados de conclusao',
          'Suporte pedagogico',
        ]),
      )
      app.save(monthly)
    }

    try {
      app.findFirstRecordByData('subscription_plans', 'name', 'Plano Anual')
    } catch (_) {
      const yearly = new Record(col)
      yearly.set('name', 'Plano Anual')
      yearly.set('description', 'Acesso anual completo com economia')
      yearly.set('price', 499.9)
      yearly.set('interval', 'yearly')
      yearly.set(
        'features',
        JSON.stringify([
          'Acesso a todos os cursos',
          'Materiais de apoio',
          'Certificados de conclusao',
          'Suporte pedagogico prioritario',
          'Acesso a mentorias',
          'Economia de 16% vs plano mensal',
        ]),
      )
      app.save(yearly)
    }
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('subscription_plans'))
  },
)
