migrate(
  (app) => {
    const docProjects = new Collection({
      name: 'doc_projects',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || @request.auth.id = '' || @request.auth.id != ''",
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'objectives', type: 'json' },
        {
          name: 'target_audience',
          type: 'select',
          values: ['Trabalhadores SST', 'Gestores', 'Treinadores', 'Estudantes', 'Outros'],
        },
        { name: 'estimated_duration', type: 'number' },
        { name: 'episodes', type: 'number' },
        { name: 'script_structure', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: [
            'Planejado',
            'Em Pré-produção',
            'Produção',
            'Pós-produção',
            'Finalizado',
            'Novo',
          ],
        },
        { name: 'notes', type: 'text' },
        { name: 'responsible', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'attachments', type: 'file', maxSelect: 10 },
        { name: 'total_budget', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(docProjects)

    const docProjectCosts = new Collection({
      name: 'doc_project_costs',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'project',
          type: 'relation',
          collectionId: docProjects.id,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'category',
          type: 'select',
          values: ['Pré-produção', 'Produção', 'Equipamentos', 'Pós-produção', 'Outros'],
        },
        { name: 'description', type: 'text' },
        { name: 'estimated_value', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(docProjectCosts)

    const docProjectRecordings = new Collection({
      name: 'doc_project_recordings',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'project',
          type: 'relation',
          collectionId: docProjects.id,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'date', type: 'date' },
        { name: 'location', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(docProjectRecordings)

    const docProjectTeam = new Collection({
      name: 'doc_project_team',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'project',
          type: 'relation',
          collectionId: docProjects.id,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text' },
        {
          name: 'role',
          type: 'select',
          values: [
            'Diretor',
            'Operador Câmera',
            'Som',
            'Iluminação',
            'Produtor',
            'Roteirista',
            'Outro',
          ],
        },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(docProjectTeam)

    const docProjectTasks = new Collection({
      name: 'doc_project_tasks',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'project',
          type: 'relation',
          collectionId: docProjects.id,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'deadline', type: 'date' },
        { name: 'responsible', type: 'text' },
        { name: 'status', type: 'select', values: ['A Fazer', 'Em Andamento', 'Concluído'] },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(docProjectTasks)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('doc_project_tasks'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('doc_project_team'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('doc_project_recordings'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('doc_project_costs'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('doc_projects'))
    } catch (_) {}
  },
)
