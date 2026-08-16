migrate(
  (app) => {
    const usersCollectionId = '_pb_users_auth_'

    // --- clientes ---
    const clientes = new Collection({
      name: 'clientes',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome_empresa', type: 'text', required: true, max: 200 },
        { name: 'cnpj', type: 'text', max: 30 },
        { name: 'nome_contato', type: 'text', required: true, max: 200 },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text', max: 40 },
        { name: 'segmento', type: 'text', max: 120 },
        { name: 'origem', type: 'text', max: 120 },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clientes_created ON clientes (created DESC)',
        'CREATE INDEX idx_clientes_origem ON clientes (origem)',
      ],
    })
    app.save(clientes)

    const clientesCollectionId = app.findCollectionByNameOrId('clientes').id

    // --- oportunidades ---
    const oportunidades = new Collection({
      name: 'oportunidades',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'cliente_id',
          type: 'relation',
          required: true,
          collectionId: clientesCollectionId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true, max: 250 },
        { name: 'valor_estimado', type: 'number' },
        {
          name: 'responsavel',
          type: 'relation',
          collectionId: usersCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'etapa',
          type: 'select',
          required: true,
          values: [
            'Cadastro',
            'Prospecção',
            'Aguardando retorno',
            'Retorno recebido',
            'Em decisão',
            'Concluído',
          ],
          maxSelect: 1,
        },
        {
          name: 'resultado',
          type: 'select',
          values: ['Ganho', 'Perdido'],
          maxSelect: 1,
        },
        { name: 'data_prevista_fechamento', type: 'date' },
        { name: 'notas', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_oportunidades_cliente ON oportunidades (cliente_id)',
        'CREATE INDEX idx_oportunidades_etapa ON oportunidades (etapa)',
        'CREATE INDEX idx_oportunidades_responsavel ON oportunidades (responsavel)',
        'CREATE INDEX idx_oportunidades_created ON oportunidades (created DESC)',
      ],
    })
    app.save(oportunidades)

    const oportunidadesCollectionId = app.findCollectionByNameOrId('oportunidades').id

    // --- etapa_historico ---
    const etapaHistorico = new Collection({
      name: 'etapa_historico',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'oportunidade_id',
          type: 'relation',
          required: true,
          collectionId: oportunidadesCollectionId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'etapa_anterior', type: 'text', max: 60 },
        { name: 'etapa_nova', type: 'text', max: 60 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_etapa_historico_op ON etapa_historico (oportunidade_id)',
        'CREATE INDEX idx_etapa_historico_created ON etapa_historico (created DESC)',
      ],
    })
    app.save(etapaHistorico)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('etapa_historico'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('oportunidades'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('clientes'))
    } catch (_) {}
  },
)
