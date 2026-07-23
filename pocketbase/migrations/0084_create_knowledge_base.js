migrate(
  (app) => {
    var entriesCol = new Collection({
      name: 'knowledge_entries',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['pdf', 'image', 'link', 'free_text'],
          maxSelect: 1,
        },
        {
          name: 'file',
          type: 'file',
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
        },
        { name: 'url', type: 'url' },
        { name: 'raw_text', type: 'text' },
        { name: 'tags', type: 'json' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['processing', 'completed', 'failed'],
          maxSelect: 1,
        },
        { name: 'error_message', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(entriesCol)

    var entriesId = app.findCollectionByNameOrId('knowledge_entries').id
    var chunksCol = new Collection({
      name: 'knowledge_chunks',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'entry',
          type: 'relation',
          required: true,
          collectionId: entriesId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'chunk_text', type: 'text', required: true },
        { name: 'embedding', type: 'vector', dimensions: 1536, distance: 'cosine' },
        { name: 'tags', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_knowledge_chunks_entry ON knowledge_chunks (entry)'],
    })
    app.save(chunksCol)

    var col = app.findCollectionByNameOrId('knowledge_entries')
    var samples = [
      {
        title: 'NR-9 - Avaliacao e Controle das Exposicoes Ocupacionais',
        type: 'free_text',
        raw_text:
          'A NR-9 estabelece diretrizes para a avaliacao das exposicoes ocupacionais a riscos fisicos e quimicos. O empregador deve identificar, avaliar e controlar os riscos ambientais atraves do PGR. A avaliacao quantitativa deve ser realizada por profissional habilitado. Os limites de tolerancia sao estabelecidos pela NR-15 e ACGIH. O monitoramento deve ser periodico e documentado. Medidas de controle seguem hierarquia: eliminacao, controle de engenharia, controle administrativo, EPI. O PGR deve conter o planejamento estrategico das acoes. A revisao deve ser anual ou apos mudancas significativas no processo. Registros devem ser mantidos por 20 anos. A comunicacao aos trabalhadores sobre os riscos identificados e obrigatoria. Exames medicos complementares devem ser compativeis com os riscos identificados no PGR.',
        tags: JSON.stringify(['NR-9', 'Riscos Ambientais', 'PGR']),
        status: 'processing',
      },
      {
        title: 'NR-15 - Atividades e Operacoes Insalubres',
        type: 'free_text',
        raw_text:
          'A NR-15 classifica as atividades insalubres em tres graus: minimo, medio e maximo. O adicional de insalubridade e calculado sobre o salario minimo. Grau minimo: 10%, grau medio: 20%, grau maximo: 40%. Insalubridade por ruido: acima de 85 dB(A) grau minimo, acima de 90 dB(A) medio, acima de 100 dB(A) maximo. Trabalho em frio abaixo de 15 graus e insalubre. Calor: baseada em IBUTG. Agentes quimicos: listados em anexos da NR-15. Agentes biologicos: hospitais, laboratorios, esgoto. A eliminacao da insalubridade pode ocorrer por adocao de medidas de controle. O pericia judicial pode modificar o enquadramento. Acumulacao com periculosidade nao e permitida, exceto se fonte geradora diferente.',
        tags: JSON.stringify(['NR-15', 'Insalubridade', 'Riscos Ambientais']),
        status: 'processing',
      },
    ]

    for (var i = 0; i < samples.length; i++) {
      var s = samples[i]
      try {
        app.findFirstRecordByData('knowledge_entries', 'title', s.title)
      } catch (_) {
        var record = new Record(col)
        record.set('title', s.title)
        record.set('type', s.type)
        record.set('raw_text', s.raw_text)
        record.set('tags', s.tags)
        record.set('status', s.status)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('knowledge_chunks'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('knowledge_entries'))
    } catch (_) {}
  },
)
