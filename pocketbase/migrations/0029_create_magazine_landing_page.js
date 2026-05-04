migrate(
  (app) => {
    const collection = new Collection({
      name: 'magazine_landing_page',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'hero_title', type: 'text', required: true },
        { name: 'hero_description', type: 'text' },
        { name: 'readers_count', type: 'text' },
        { name: 'plans', type: 'json' },
        { name: 'whatsapp_number', type: 'text' },
        { name: 'cta_text', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)

    const record = new Record(collection)
    record.set('hero_title', 'Alcance a Elite da SST: Sua Marca na Revista Educação SST')
    record.set(
      'hero_description',
      'Conecte seus produtos e serviços diretamente aos principais profissionais, gestores e tomadores de decisão em Segurança e Saúde no Trabalho do Brasil.',
    )
    record.set('readers_count', '+2.000')
    record.set('plans', [
      {
        title: 'Trimestral',
        insertions: '3 Inserções',
        price: 1200,
        pricePerInsertion: 400,
        features: ['1/1 Página nas próximas 3 edições', 'Links interativos'],
        bestValue: false,
      },
      {
        title: 'Semestral',
        insertions: '6 Inserções',
        price: 2000,
        pricePerInsertion: 333,
        features: [
          '1/1 Página nas próximas 6 edições',
          'Links interativos',
          'Posicionamento Premium',
        ],
        bestValue: true,
      },
      {
        title: 'Anual',
        insertions: '12 Inserções',
        price: 3600,
        pricePerInsertion: 300,
        features: ['1/1 Página por 12 meses', 'Links interativos', 'Posicionamento Premium'],
        bestValue: false,
      },
    ])
    record.set('whatsapp_number', '5518997190486')
    record.set('cta_text', 'Tenho interesse em anunciar')
    app.save(record)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('magazine_landing_page')
    app.delete(collection)
  },
)
