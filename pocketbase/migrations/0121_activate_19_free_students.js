migrate(
  (app) => {
    // Lista dos 19 alunos aprovados para ativação:
    // Validade = hoje (13/10/2026) + 1 ano no fuso America/Sao_Paulo (UTC-3)
    // contract_end_date = '2027-10-13 00:00:00.000Z'
    // plan_tier = 'free'
    // email_verificado = true
    // verified = true
    // Começando por Flavia de Oliveira Ferrer (cadastro de 13/10/2026)

    const targetUsers = [
      {
        id: 'e4c85zqqy42hbut',
        email: 'flaviaferrer.sst@gmail.com',
        name: 'Flavia de Oliveira Ferrer',
      },
      {
        id: 'cfwf59dcn3b7zx5',
        email: 'ivo-engseg@hotmail.com',
        name: 'Ivo Cezar Gonçalves da Silva viana',
      },
      { id: 'eks5t1k736oodnl', email: 'eng.brunorocha@gmail.com', name: 'Bruno Rocha' },
      {
        id: 'kl9vekx8ttrsdx0',
        email: 'idamo.junior@iaco.com.br',
        name: 'Idamo Antonio Iacomini Júnior',
      },
      { id: 'd3tn61xpkujbb37', email: 'renatosalgadotst@gmail.com', name: 'Renato Dias Salgado' },
      { id: 'zuxqeeqbwha1yhy', email: 'marketing@exclusivepi.com.br', name: 'Cristhyan Arruda' },
      { id: 'bfyy8uvs5r47h5r', email: 'freitas-oi.tiago@hotmail.com', name: 'Tiago de Freitas' },
      { id: 'mn8j4303gttmf8r', email: 'francynevieira@yahoo.com.br', name: 'Francyne Paula e' },
      { id: '4ka1p5138bm8zoo', email: 'set_life@hotmail.com', name: 'SETlife' },
      {
        id: 'nuudnuefe5h2jwr',
        email: 'emersonsales1@hotmail.com',
        name: 'EMERSON HENRIQUE ALVES DE SALES',
      },
      { id: 'mo8099c6rhazu5m', email: 'ingridreisdearaujo@gmail.com', name: 'INGRID REIS COSTA' },
      { id: 'svkl6oclvb5m248', email: 'pv260982@gmail.com', name: 'Paulo Henrique' },
      {
        id: 'hrvr9mzo579rq0q',
        email: 'robson.peixoto@celsoonline.com.br',
        name: 'ROBSON PEIXOTO DOS SANTOS',
      },
      { id: 'kyobcege7rjo8ny', email: 'rkhevenn@gmail.com', name: 'RHYAN KHEVENN SILVA VIANA' },
      {
        id: 'qjjs594ziq5cwam',
        email: 'vitor.pereirasantos@hotmail.com',
        name: 'Vitor Pereira Santos',
      },
      {
        id: 'mq0vmvrznym36vk',
        email: 'pmbittencourt@leaoalimentosebebidas.com.br',
        name: 'Patricia Machado Bittencourt',
      },
      { id: 'nltzq6jelbkwv5z', email: 'adriano.vago@aperam.com', name: 'Adriano Vago' },
      {
        id: 't4xkfk3wem5e67b',
        email: 'joaribenites2008@hotmail.com',
        name: 'JOARI JOASIL BENITES',
      },
      {
        id: '3xeqwd0wzoazycd',
        email: 'melquiades.almeida@outlook.com',
        name: 'Melquiades Almeida Santana Neto',
      },
    ]

    // Achar o plano Free para vincular a assinatura, se necessário
    let freePlanId = ''
    try {
      const freePlan = app.findFirstRecordByFilter(
        'subscription_plans',
        "price = 0 || name ~ 'Free'",
      )
      if (freePlan) freePlanId = freePlan.id
    } catch (_) {}

    const subsCol = app.findCollectionByNameOrId('subscriptions')

    for (let i = 0; i < targetUsers.length; i++) {
      const target = targetUsers[i]
      let userRecord = null

      try {
        userRecord = app.findRecordById('users', target.id)
      } catch (_) {
        try {
          userRecord = app.findAuthRecordByEmail('users', target.email)
        } catch (err) {
          console.log(
            'Aluno não encontrado: ' + target.name + ' (' + target.email + '): ' + err.message,
          )
          continue
        }
      }

      userRecord.set('contract_end_date', '2027-10-13 00:00:00.000Z')
      userRecord.set('plan_tier', 'free')
      userRecord.set('email_verificado', true)
      userRecord.setVerified(true)
      app.save(userRecord)

      // Garantir registro de subscription ativo para o aluno
      try {
        let sub = null
        try {
          sub = app.findFirstRecordByFilter('subscriptions', "user = '" + userRecord.id + "'")
        } catch (_) {}

        if (sub) {
          sub.set('status', 'active')
          if (freePlanId && !sub.getString('plan')) {
            sub.set('plan', freePlanId)
          }
          app.save(sub)
        } else {
          const newSub = new Record(subsCol)
          newSub.set('user', userRecord.id)
          newSub.set('status', 'active')
          if (freePlanId) newSub.set('plan', freePlanId)
          app.save(newSub)
        }
      } catch (subErr) {
        console.log('Erro ao atualizar subscription para ' + target.name + ': ' + subErr.message)
      }
    }
  },
  (app) => {
    // Revert opcional
  },
)
