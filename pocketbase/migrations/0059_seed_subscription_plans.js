migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('subscription_plans')

    var oldNames = ['Plano Mensal', 'Plano Anual']
    for (var j = 0; j < oldNames.length; j++) {
      try {
        var old = app.findFirstRecordByData('subscription_plans', 'name', oldNames[j])
        app.delete(old)
      } catch (_) {}
    }

    var plans = [
      {
        name: 'Free',
        description: 'Acesso gratuito ao conteudo basico da plataforma',
        price: 0,
        interval: 'monthly',
        features: JSON.stringify([
          'Hub do Aluno',
          'Revista Educacao SST Digital',
          'Cursos selecionados gratuitos',
          'Aulas ao vivo as quartas-feiras',
          'Caderno de Estudos Digital',
          'Feed de Cases',
        ]),
      },
      {
        name: 'Prata Mensal',
        description: 'Acesso completo com cobranca mensal',
        price: 49.9,
        interval: 'monthly',
        features: JSON.stringify([
          'Todos os recursos do plano Free',
          'Acesso a todos os cursos da plataforma',
          'Gravacoes de aulas ao vivo anteriores',
          'Documentarios exclusivos',
          'Descontos exclusivos em mentorias',
        ]),
      },
      {
        name: 'Prata Anual',
        description: 'Acesso completo com economia - cobranca anual',
        price: 358.8,
        interval: 'yearly',
        features: JSON.stringify([
          'Todos os recursos do plano Free',
          'Acesso a todos os cursos da plataforma',
          'Gravacoes de aulas ao vivo anteriores',
          'Documentarios exclusivos',
          'Descontos exclusivos em mentorias',
          'Economia de 40% vs plano mensal',
        ]),
      },
      {
        name: 'Ouro Mensal',
        description: 'Acesso premium com cobranca mensal + Revista fisica',
        price: 89.9,
        interval: 'monthly',
        features: JSON.stringify([
          'Todos os recursos do plano Prata',
          'Box+ - Revista Educacao SST fisica enviada para sua casa',
          'Frete incluso para todo o Brasil',
        ]),
      },
      {
        name: 'Ouro Anual',
        description: 'Acesso premium com economia - cobranca anual + Revista fisica',
        price: 838.8,
        interval: 'yearly',
        features: JSON.stringify([
          'Todos os recursos do plano Prata',
          'Box+ - Revista Educacao SST fisica enviada para sua casa',
          'Frete incluso para todo o Brasil',
          'Economia de 22% vs plano mensal',
        ]),
      },
    ]

    for (var i = 0; i < plans.length; i++) {
      var planData = plans[i]
      try {
        app.findFirstRecordByData('subscription_plans', 'name', planData.name)
      } catch (_) {
        var record = new Record(col)
        record.set('name', planData.name)
        record.set('description', planData.description)
        record.set('price', planData.price)
        record.set('interval', planData.interval)
        record.set('features', planData.features)
        app.saveNoValidate(record)
      }
    }
  },
  (app) => {
    var names = ['Free', 'Prata Mensal', 'Prata Anual', 'Ouro Mensal', 'Ouro Anual']
    for (var i = 0; i < names.length; i++) {
      try {
        var record = app.findFirstRecordByData('subscription_plans', 'name', names[i])
        app.delete(record)
      } catch (_) {}
    }
  },
)
