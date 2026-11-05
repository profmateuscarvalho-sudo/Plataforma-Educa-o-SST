migrate(
  (app) => {
    // ---- 1. Coleção de leads do concurso "Sou Educação SST" -----------------
    const leads = new Collection({
      name: 'leads_dia_tst',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true, max: 120 },
        { name: 'cidade_uf', type: 'text', required: true, max: 80 },
        { name: 'email', type: 'email', required: true },
        { name: 'whatsapp', type: 'text', required: true, max: 15, pattern: '^\\d{10,13}$' },
        { name: 'instagram', type: 'text', required: true, max: 40, pattern: '^@' },
        { name: 'frase', type: 'text', required: true, max: 300 },
        { name: 'aceite_regulamento', type: 'bool' },
        { name: 'aceite_lgpd', type: 'bool' },
        { name: 'aceita_comunicacoes', type: 'bool' },
        { name: 'story_verificado', type: 'bool' },
        { name: 'nota', type: 'number', onlyInt: false, min: 0, max: 10 },
        { name: 'origem', type: 'text', max: 200 },
        { name: 'ip', type: 'text', max: 64 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_leads_dia_tst_email ON leads_dia_tst (email)',
        'CREATE INDEX idx_leads_dia_tst_created ON leads_dia_tst (created)',
        'CREATE INDEX idx_leads_dia_tst_ip_created ON leads_dia_tst (ip, created)',
      ],
    })
    app.save(leads)

    // ---- 2. Configuração editável (regulamento completo) --------------------
    const config = new Collection({
      name: 'dia_tst_config',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: null,
      fields: [
        { name: 'chave', type: 'text', required: true, max: 60 },
        { name: 'regulamento', type: 'editor', maxSize: 2000000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_dia_tst_config_chave ON dia_tst_config (chave)'],
    })
    app.save(config)

    const cfg = new Record(config)
    cfg.set('chave', 'regulamento')
    cfg.set(
      'regulamento',
      '<p><strong>REGULAMENTO — CONCURSO CULTURAL "SOU EDUCAÇÃO SST"</strong></p>' +
        '<p><em>(Texto oficial será inserido pela equipe aqui no painel administrativo, sem necessidade de alteração de código.)</em></p>' +
        '<p>1. O concurso cultural "Sou Educação SST" é uma ação exclusivamente cultural, sem sorteio e sem necessidade de compra, promovido pela EDUCAÇÃO SST LTDA, CNPJ 56.009.540/0001-90, em comemoração ao Dia do Técnico em Segurança do Trabalho (27 de novembro).</p>' +
        '<p>2. Podem participar técnicos em Segurança do Trabalho (e estudantes da área) residentes no Brasil, inscritos na página oficial da campanha até 27/11/2026 às 23h59 (horário de Brasília).</p>' +
        '<p>3. Para participar, o(a) participante deve: (a) preencher o formulário de inscrição; (b) montar a capa de story no próprio aparelho; (c) publicar a imagem nos stories do Instagram marcando a Revista Educação SST, com perfil público no dia da publicação.</p>' +
        '<p>4. As frases mais marcantes serão selecionadas por uma comissão julgadora e os autores premiados com livros, EPIs e produtos oferecidos pelos parceiros da campanha.</p>' +
        '<p>5. Ao se inscrever, o(a) participante declara ser o(a) autor(a) da frase e autoriza o uso de sua frase, nome, cidade e imagem na divulgação da campanha e na Revista Educação SST, sem ônus.</p>' +
        '<p>6. O resultado será divulgado nos canais oficiais da Revista Educação SST.</p>',
    )
    app.save(cfg)

    // ---- 3. Parceiros da faixa de logos (cadastráveis pelo painel) ----------
    const partners = new Collection({
      name: 'dia_tst_partners',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true, max: 80 },
        {
          name: 'logo',
          type: 'file',
          maxSelect: 1,
          maxSize: 2097152,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
          thumbs: ['160x0'],
        },
        { name: 'ordem', type: 'number', onlyInt: true },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_dia_tst_partners_ordem ON dia_tst_partners (ordem)'],
    })
    app.save(partners)
  },
  (app) => {
    for (const name of ['leads_dia_tst', 'dia_tst_partners', 'dia_tst_config']) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
  },
)
