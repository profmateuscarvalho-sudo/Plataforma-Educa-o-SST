// BLOCO 4 fechamento — Parte 2: religar subscriptions órfãs.
// O usuário excluiu manualmente os planos antigos ("Prata Mensal", "Ouro
// Mensal", "Prata Anual", "Ouro Anual"); assinaturas que apontavam para eles
// ficaram com a relação `plan` vazia. Esta migração religa cada uma ao plano
// ATUAL do mesmo nível, inferido do plan_tier do usuário (ouro/prata).
// Nível não inferível fica intacto para decisão manual (listado no relatório).
// Idempotente: só toca em registros com plan vazio.
migrate(
  (app) => {
    var plans = app.findRecordsByFilter('subscription_plans', 'is_active = true', '', 200, 0)
    var byTier = {}
    for (var i = 0; i < plans.length; i++) {
      var name = (plans[i].getString('name') || '').toLowerCase()
      if (name.indexOf('ouro') !== -1 && !byTier.ouro) byTier.ouro = plans[i].id
      else if (name.indexOf('prata') !== -1 && !byTier.prata) byTier.prata = plans[i].id
      else if (name.indexOf('free') !== -1 && !byTier.free) byTier.free = plans[i].id
    }

    if (!byTier.prata && !byTier.ouro) {
      console.log('[0139] nenhum plano prata/ouro ativo — nada a religar')
      return
    }

    var orphans = app.findRecordsByFilter('subscriptions', "plan = ''", '', 10000, 0)
    var relinked = 0
    var skipped = 0

    for (var j = 0; j < orphans.length; j++) {
      var sub = orphans[j]
      var userId = sub.getString('user')
      var tier = ''

      try {
        var user = app.findRecordById('_pb_users_auth_', userId)
        var userTier = (user.getString('plan_tier') || '').toLowerCase()
        if (userTier === 'ouro' || userTier === 'prata') tier = userTier
      } catch (_) {}

      var targetPlanId = tier ? byTier[tier] : ''
      if (!targetPlanId) {
        skipped++
        console.log(
          '[0139] subscription ' +
            sub.id +
            ' (user=' +
            userId +
            ', created=' +
            sub.getString('created') +
            ') sem nível seguro — não religada',
        )
        continue
      }

      sub.set('plan', targetPlanId)
      app.saveNoValidate(sub)
      relinked++
      console.log('[0139] subscription ' + sub.id + ' religada ao plano ' + tier)
    }

    console.log('[0139] religadas: ' + relinked + '; sem nível seguro: ' + skipped)
  },
  (app) => {},
)
