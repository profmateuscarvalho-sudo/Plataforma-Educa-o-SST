/// <reference path="../pb_data/types.d.ts" />
// Índices para as telas do admin (v0.0.389): filtros realmente usados e sem
// índice. Somente índices; nenhuma regra de acesso ou dado é alterado.
migrate(
  (app) => {
    const ensureIndex = (collectionName, name, indexSql) => {
      const col = app.findCollectionByNameOrId(collectionName)
      const raw = col.indexesJson || []
      if (raw.some((idx) => idx.name === name)) return
      raw.push({
        name: name,
        columns: indexSql,
        unique: false,
        create_sql: 'CREATE INDEX `' + name + '` ON `' + collectionName + '` (' + indexSql + ')',
        drop_sql: 'DROP INDEX IF EXISTS `' + name + '`',
      })
      col.set('indexes', raw)
      app.save(col)
    }

    // Alunos (AdminStudents/Dashboard): filtro role != 'admin', ordenação -created,
    // contagem de contratos vigentes e busca por e-mail.
    ensureIndex('users', 'idx_users_role_created', '`role`, `created` DESC')
    ensureIndex('users', 'idx_users_contract_end', '`contract_end_date`')

    // Vendas/Pagamentos (AdminPayments): ordenação -created e expand user.
    ensureIndex('payments', 'idx_payments_created', '`created` DESC')
    ensureIndex('payments', 'idx_payments_user', '`user`')

    // Leads (AdminLeads): ordenação -created.
    ensureIndex('leads', 'idx_leads_created', '`created` DESC')

    // Mentorias (AdminMentorships): ordenação -created e filtro/expand mentor.
    ensureIndex('mentorships', 'idx_mentorships_created', '`created` DESC')
    ensureIndex('mentorships', 'idx_mentorships_mentor', '`mentor`')
  },
  (app) => {
    const drop = (collectionName, name) => {
      try {
        const col = app.findCollectionByNameOrId(collectionName)
        const raw = (col.indexesJson || []).filter((idx) => idx.name !== name)
        col.set('indexes', raw)
        app.save(col)
      } catch (err) {
        console.log('rollback skip ' + collectionName + '/' + name + ': ' + err)
      }
    }
    drop('users', 'idx_users_role_created')
    drop('users', 'idx_users_contract_end')
    drop('payments', 'idx_payments_created')
    drop('payments', 'idx_payments_user')
    drop('leads', 'idx_leads_created')
    drop('mentorships', 'idx_mentorships_created')
    drop('mentorships', 'idx_mentorships_mentor')
  },
)
