// BLOCO 1 — REESTRUTURAÇÃO DOS PLANOS: somente assinatura ANUAL.
//
// - Novos campos de promoção em subscription_plans:
//     promo_active        (bool)
//     promo_monthly_price (number)
//     promo_ends_at       (date)
//     promo_label         (text)
// - O campo `price` passa a significar o VALOR MENSAL DE REFERÊNCIA
//   (Prata 14.90, Ouro 69.90, Free 0). `price_yearly` deixa de ser usado
//   (campo preservado no schema — nada é apagado).
// - Registros antigos "Prata Mensal", "Prata Anual", "Ouro Mensal" e
//   "Ouro Anual" são OCULTADOS (is_coming_soon = true), sem apagar.
//   Os dados antigos ficam intactos no banco.
// - Cria/ajusta os 3 planos vigentes: "Free" (0), "Prata" (14.90) e
//   "Ouro" (69.90, is_coming_soon = true).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('subscription_plans')

    // 1. Campos de promoção (idempotente: só cria se não existirem)
    if (!col.fields.getByName('promo_active')) {
      col.fields.add(new BoolField({ name: 'promo_active' }))
    }
    if (!col.fields.getByName('promo_monthly_price')) {
      col.fields.add(new NumberField({ name: 'promo_monthly_price', onlyInt: false }))
    }
    if (!col.fields.getByName('promo_ends_at')) {
      col.fields.add(new DateField({ name: 'promo_ends_at' }))
    }
    if (!col.fields.getByName('promo_label')) {
      col.fields.add(new TextField({ name: 'promo_label', max: 100 }))
    }
    app.save(col)

    // 2. Oculta os planos antigos (sem apagar) — nomes começando com
    //    "Prata Mensal", "Prata Anual", "Ouro Mensal", "Ouro Anual".
    const legacy = ['Prata Mensal', 'Prata Anual', 'Ouro Mensal', 'Ouro Anual']
    for (const legacyName of legacy) {
      try {
        const r = app.findFirstRecordByFilter('subscription_plans', 'name = "' + legacyName + '"')
        r.set('is_coming_soon', true)
        app.save(r)
      } catch (_) {
        // registro não existe — nada a fazer
      }
    }

    // 3. Cria/ajusta os planos vigentes (um por nível, nome exato do tier)
    const upsertPlan = (name, price, description, features, comingSoon) => {
      let rec = null
      try {
        rec = app.findFirstRecordByFilter('subscription_plans', 'name = "' + name + '"')
      } catch (_) {
        rec = null
      }
      if (!rec) {
        rec = new Record(col)
        rec.set('name', name)
        rec.set('interval', 'yearly')
      }
      rec.set('price', price)
      rec.set('description', description)
      rec.set('features', features)
      rec.set('is_coming_soon', comingSoon)
      // promoção desligada por padrão
      rec.set('promo_active', false)
      rec.set('promo_monthly_price', 0)
      rec.set('promo_ends_at', '')
      rec.set('promo_label', '')
      app.save(rec)
    }

    upsertPlan(
      'Free',
      0,
      'Acesso gratuito ao conteudo basico da plataforma',
      [
        'Hub do Aluno',
        'Cursos selecionados gratuitos',
        'Caderno de Estudos Digital',
        'Documentários selecionados',
      ],
      false,
    )

    upsertPlan(
      'Prata',
      14.9,
      'Assinatura anual — acesso completo à plataforma',
      [
        'Acesso a todas edições da Revista Digital',
        'Acesso aos cursos',
        'Acesso a aulas ao vivo',
        'Documentário Original Educação SST',
        'Desconto exclusivo em mentorias',
      ],
      false,
    )

    upsertPlan(
      'Ouro',
      69.9,
      'Assinatura anual — acesso premium com Revista impressa (frete incluso)',
      [
        'Tudo do Prata, e mais:',
        'Frete incluso para todo o Brasil',
        'Assinatura do BOX da Revista Impressa Educação SST',
      ],
      true, // Ouro continua "Em breve"
    )
  },
  (app) => {
    // Revert: remove apenas os campos de promoção (planos criados ficam).
    const col = app.findCollectionByNameOrId('subscription_plans')
    for (const f of ['promo_active', 'promo_monthly_price', 'promo_ends_at', 'promo_label']) {
      const field = col.fields.getByName(f)
      if (field) {
        col.fields.removeByName(f)
      }
    }
    app.save(col)
  },
)
