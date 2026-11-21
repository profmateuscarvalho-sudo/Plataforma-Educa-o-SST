/// <reference path="../pb_data/types.d.ts" />
// Índices para as telas do admin (v0.0.389): filtros realmente usados e sem
// índice. Somente índices; nenhuma regra de acesso ou dado é alterado.
// Criados via SQL direto (app.db().newQuery) — a Collection da JSVM não
// suporta .set('indexes', ...) nesta plataforma.
migrate(
  (app) => {
    const indexes = [
      // Alunos (AdminStudents/Dashboard): filtro role != 'admin', ordenação -created,
      // contagem de contratos vigentes e busca por e-mail.
      ['idx_users_role_created', 'users', '`role`, `created` DESC'],
      ['idx_users_contract_end', 'users', '`contract_end_date`'],
      // Vendas/Pagamentos (AdminPayments): ordenação -created e expand user.
      ['idx_payments_created', 'payments', '`created` DESC'],
      ['idx_payments_user', 'payments', '`user`'],
      // Leads (AdminLeads): ordenação -created.
      ['idx_leads_created', 'leads', '`created` DESC'],
      // Mentorias (AdminMentorships): ordenação -created e filtro/expand mentor.
      ['idx_mentorships_created', 'mentorships', '`created` DESC'],
      ['idx_mentorships_mentor', 'mentorships', '`mentor`'],
    ]

    for (const idx of indexes) {
      const name = idx[0]
      const table = idx[1]
      const columns = idx[2]
      try {
        app
          .db()
          .newQuery(
            'CREATE INDEX IF NOT EXISTS `' + name + '` ON `' + table + '` (' + columns + ')',
          )
          .execute()
        console.log('index criado: ' + name)
      } catch (err) {
        console.log('index falhou ' + name + ': ' + err)
        throw err
      }
    }
  },
  (app) => {
    const names = [
      'idx_users_role_created',
      'idx_users_contract_end',
      'idx_payments_created',
      'idx_payments_user',
      'idx_leads_created',
      'idx_mentorships_created',
      'idx_mentorships_mentor',
    ]
    for (const name of names) {
      try {
        app
          .db()
          .newQuery('DROP INDEX IF EXISTS `' + name + '`')
          .execute()
      } catch (err) {
        console.log('rollback skip ' + name + ': ' + err)
      }
    }
  },
)
