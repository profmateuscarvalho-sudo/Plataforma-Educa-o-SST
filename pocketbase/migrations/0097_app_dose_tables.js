migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const simuladoQuestionsCol = app.findCollectionByNameOrId('simulado_questions')

    // dose_perguntas — índice das questões elegíveis para a Dose do dia.
    const dosePerguntas = new Collection({
      name: 'dose_perguntas',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.role = "admin"',
      updateRule: '@request.auth.role = "admin"',
      deleteRule: '@request.auth.role = "admin"',
      fields: [
        {
          name: 'questao_id',
          type: 'relation',
          required: true,
          collectionId: simuladoQuestionsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'ativa', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_dose_perguntas_questao ON dose_perguntas (questao_id)'],
    })
    app.save(dosePerguntas)

    // dose_respostas — uma resposta por usuário por dia (fuso de Brasília).
    const doseRespostas = new Collection({
      name: 'dose_respostas',
      type: 'base',
      listRule: '@request.auth.id != "" && usuario_id = @request.auth.id',
      viewRule: '@request.auth.id != "" && usuario_id = @request.auth.id',
      createRule: '@request.auth.id != "" && usuario_id = @request.auth.id',
      updateRule: '@request.auth.id != "" && usuario_id = @request.auth.id',
      deleteRule: '@request.auth.role = "admin"',
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'pergunta_id',
          type: 'relation',
          required: true,
          collectionId: dosePerguntas.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'acertou', type: 'bool' },
        { name: 'respondida_em', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_dose_respostas_usuario_data ON dose_respostas (usuario_id, data)',
      ],
    })
    app.save(doseRespostas)

    // sequencia_usuario — sequência de dias respondidos da dose.
    const sequenciaUsuario = new Collection({
      name: 'sequencia_usuario',
      type: 'base',
      listRule: '@request.auth.id != "" && usuario_id = @request.auth.id',
      viewRule: '@request.auth.id != "" && usuario_id = @request.auth.id',
      createRule: '@request.auth.id != "" && usuario_id = @request.auth.id',
      updateRule: '@request.auth.id != "" && usuario_id = @request.auth.id',
      deleteRule: '@request.auth.role = "admin"',
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'sequencia_atual', type: 'number' },
        { name: 'recorde', type: 'number' },
        { name: 'ultima_data', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_sequencia_usuario ON sequencia_usuario (usuario_id)'],
    })
    app.save(sequenciaUsuario)

    // push_subscriptions — endpoints de push por usuário, para o lembrete diário.
    const pushSubscriptions = new Collection({
      name: 'push_subscriptions',
      type: 'base',
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: '@request.auth.id != "" && user = @request.auth.id',
      createRule: '@request.auth.id != "" && user = @request.auth.id',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
      deleteRule: '@request.auth.id != "" && user = @request.auth.id',
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'endpoint', type: 'text', required: true },
        { name: 'p256dh', type: 'text' },
        { name: 'auth', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_push_subscriptions_endpoint ON push_subscriptions (endpoint)',
        'CREATE INDEX idx_push_subscriptions_user ON push_subscriptions (user)',
      ],
    })
    app.save(pushSubscriptions)

    // Preferências de lembrete diário e notificação no próprio usuário.
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('lembrete_diario_ativo')) {
      users.fields.add(new BoolField({ name: 'lembrete_diario_ativo' }))
    }
    if (!users.fields.getByName('lembrete_diario_hora')) {
      users.fields.add(new TextField({ name: 'lembrete_diario_hora' }))
    }
    app.save(users)

    // Popula o índice com todas as questões de simulados já existentes.
    let existing = 0
    try {
      existing = app.countRecords('simulado_questions')
    } catch (_) {}
    if (existing > 0) {
      let qs = []
      try {
        qs = app.findRecordsByFilter('simulado_questions', '', 'created', 1000, 0)
      } catch (_) {}
      var col = app.findCollectionByNameOrId('dose_perguntas')
      for (var i = 0; i < qs.length; i++) {
        var qid = qs[i].id
        var already = false
        try {
          app.findFirstRecordByData('dose_perguntas', 'questao_id', qid)
          already = true
        } catch (_) {}
        if (!already) {
          var rec = new Record(col)
          rec.set('questao_id', qid)
          rec.set('ativa', true)
          app.save(rec)
        }
      }
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('push_subscriptions'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('sequencia_usuario'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('dose_respostas'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('dose_perguntas'))
    } catch (_) {}
    try {
      var users = app.findCollectionByNameOrId('users')
      var lf = users.fields.getByName('lembrete_diario_hora')
      if (lf) users.fields.removeByName('lembrete_diario_hora')
      var bf = users.fields.getByName('lembrete_diario_ativo')
      if (bf) users.fields.removeByName('lembrete_diario_ativo')
      app.save(users)
    } catch (_) {}
  },
)
