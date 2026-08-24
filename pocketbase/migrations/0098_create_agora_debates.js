migrate(
  (app) => {
    // 1. agora_debates
    const agoraDebates = new Collection({
      name: 'agora_debates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (moderador_id = @request.auth.id || @request.auth.role = 'admin')",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'tema', type: 'text', required: true },
        { name: 'descricao', type: 'text', required: true },
        { name: 'categoria_tags', type: 'text', required: false },
        { name: 'data_inicio', type: 'date', required: true },
        { name: 'data_termino', type: 'date', required: true },
        { name: 'regras_conduta', type: 'text', required: false },
        {
          name: 'moderador_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['agendado', 'em_andamento', 'encerrado'],
          maxSelect: 1,
        },
        { name: 'conclusoes', type: 'text', required: false },
        { name: 'aprendizados', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_agora_debates_status ON agora_debates (status)',
        'CREATE INDEX idx_agora_debates_moderador ON agora_debates (moderador_id)',
        'CREATE INDEX idx_agora_debates_termino ON agora_debates (data_termino)',
      ],
    })
    app.save(agoraDebates)

    const debatesCollectionId = app.findCollectionByNameOrId('agora_debates').id

    // 2. agora_votos
    const agoraVotos = new Collection({
      name: 'agora_votos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.body.usuario_id = @request.auth.id",
      updateRule: null, // Votos são imutáveis após criação
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'debate_id',
          type: 'relation',
          required: true,
          collectionId: debatesCollectionId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'posicao',
          type: 'select',
          required: true,
          values: ['a_favor', 'contra', 'complementacao'],
          maxSelect: 1,
        },
        { name: 'justificativa', type: 'text', required: true, min: 50 },
        { name: 'apoios', type: 'number', required: false, min: 0 },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_agora_votos_debate_user ON agora_votos (debate_id, usuario_id)',
        'CREATE INDEX idx_agora_votos_debate ON agora_votos (debate_id)',
      ],
    })
    app.save(agoraVotos)

    const votosCollectionId = app.findCollectionByNameOrId('agora_votos').id

    // 3. agora_apoios
    const agoraApoios = new Collection({
      name: 'agora_apoios',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.body.usuario_id = @request.auth.id",
      updateRule: null,
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      fields: [
        {
          name: 'voto_id',
          type: 'relation',
          required: true,
          collectionId: votosCollectionId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_agora_apoios_voto_user ON agora_apoios (voto_id, usuario_id)',
        'CREATE INDEX idx_agora_apoios_voto ON agora_apoios (voto_id)',
      ],
    })
    app.save(agoraApoios)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('agora_apoios'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('agora_votos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('agora_debates'))
    } catch (_) {}
  },
)
