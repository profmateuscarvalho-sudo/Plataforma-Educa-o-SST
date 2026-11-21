// ---------------------------------------------------------------------------
// 0142 — Índices de desempenho para o controle de acesso por plano.
//
// O access_guard consulta por (user, status, product_type) em payments e por
// (user, status) em subscriptions a cada request de conteúdo protegido; e o
// mapa módulo -> curso lê modules.course. Sem índice, cada consulta era um
// full scan — a causa da lentidão generalizada (admin incluso).
// Idempotente: col.addIndex não falha se o índice já existir.
// ---------------------------------------------------------------------------

migrate(
  (app) => {
    var payments = app.findCollectionByNameOrId('payments')
    payments.addIndex('idx_payments_user_status_type', false, 'user, status, product_type', '')
    payments.addIndex('idx_payments_magazine_id', false, 'magazine_id', '')
    app.save(payments)

    var subscriptions = app.findCollectionByNameOrId('subscriptions')
    subscriptions.addIndex('idx_subscriptions_user_status', false, 'user, status', '')
    app.save(subscriptions)

    var modules = app.findCollectionByNameOrId('modules')
    modules.addIndex('idx_modules_course', false, 'course', '')
    app.save(modules)
  },
  (app) => {
    var payments = app.findCollectionByNameOrId('payments')
    payments.removeIndex('idx_payments_user_status_type')
    payments.removeIndex('idx_payments_magazine_id')
    app.save(payments)

    var subscriptions = app.findCollectionByNameOrId('subscriptions')
    subscriptions.removeIndex('idx_subscriptions_user_status')
    app.save(subscriptions)

    var modules = app.findCollectionByNameOrId('modules')
    modules.removeIndex('idx_modules_course')
    app.save(modules)
  },
)
