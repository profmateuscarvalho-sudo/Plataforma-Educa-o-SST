// BLOCO 4 fechamento — Parte 2: religar subscriptions órfãs.
// O usuário excluiu manualmente os planos antigos ("Prata Mensal", "Ouro
// Mensal", "Prata Anual", "Ouro Anual"); assinaturas que apontavam para eles
// ficaram com a relação `plan` vazia. Esta migração religa cada uma ao plano
// ATUAL do mesmo nível, inferido do plan_tier do usuário (ouro/prata).
//
// Schema real (confirmado ao vivo):
// - subscription_plans NÃO tem campo is_active — a busca é por nome/tier,
//   preferindo os planos anuais (interval = 'yearly', os planos atuais);
// - subscriptions: user (relation required), status (select: pending|active),
//   plan (relation), token, created/updated. Órfãs com status 'active' são
//   processadas primeiro; pendentes também são religadas quando há nível.
//
// Nível não inferível fica intacto para decisão manual (listado no relatório).
// Idempotente: só toca em registros com plan vazio.
migrate(
  (app) => {
    var plans = app.findRecordsByFilter('subscription_plans', '', '-created', 200, 0)
    var byTier = {}

    function tierFromName(name) {
      name = (name || '').toLowerCase()
      if (name.indexOf('ouro') !== -1) return 'ouro'
      if (name.indexOf('prata') !== -1) return 'prata'
      if (name.indexOf('free') !== -1) return 'free'
      return ''
    }

    // Primeira passada: preferir planos anuais (os planos vigentes).
    for (var i = 0; i < plans.length; i++) {
      var tierA = tierFromName(plans[i].getString('name'))
      if (!tierA || byTier[tierA]) continue
      if ((plans[i].getString('interval') || '') === 'yearly') byTier[tierA] = plans[i].id
    }
    // Segunda passada: fallback para o primeiro plano do tier encontrado.
    for (var k = 0; k < plans.length; k++) {
      var tierB = tierFromName(plans[k].getString('name'))
      if (tierB && !byTier[tierB]) byTier[tierB] = plans[k].id
    }

    if (!byTier.prata && !byTier.ouro) {
      console.log('[0139] nenhum plano prata/ouro encontrado — nada a religar')
      return
    }

    var orphans = app.findRecordsByFilter('subscriptions', "plan = ''", 'status,-created', 10000, 0)
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
            ', status=' +
            sub.getString('status') +
            ', created=' +
            sub.getString('created') +
            ') sem nível seguro — não religada',
        )
        continue
      }

      sub.set('plan', targetPlanId)
      app.saveNoValidate(sub)
      relinked++
      console.log(
        '[0139] subscription ' +
          sub.id +
          ' (status=' +
          sub.getString('status') +
          ') religada ao plano ' +
          tier,
      )
    }

    console.log('[0139] religadas: ' + relinked + '; sem nível seguro: ' + skipped)
  },
  (app) => {},
)
