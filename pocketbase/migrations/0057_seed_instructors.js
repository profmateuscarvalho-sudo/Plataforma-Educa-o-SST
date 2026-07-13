migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('instructors')
    const seed = [
      {
        name: 'Dr. Carlos Mendes',
        topics: 'Medicina do Trabalho, NR-7, PCMSO',
        bio: '<p>Medico do Trabalho com mais de 15 anos de experiencia em programas de saude ocupacional, atuando em industrias quimica e metalurgica.</p>',
      },
      {
        name: 'Eng. Patricia Santos',
        topics: 'Engenharia de Seguranca, NR-10, PPR',
        bio: '<p>Engenheira de Seguranca do Trabalho especializada nos setores industrial e de energia, com certificacao em gestao de riscos.</p>',
      },
      {
        name: 'Enf. Roberto Almeida',
        topics: 'Enfermagem do Trabalho, NR-32, CIPA',
        bio: '<p>Enfermeiro do Trabalho com atuacao em hospitais e industrias farmaceuticas, focado em vigilancia em saude do trabalhador.</p>',
      },
    ]
    for (const data of seed) {
      try {
        app.findFirstRecordByData('instructors', 'name', data.name)
      } catch (_) {
        const record = new Record(col)
        record.set('name', data.name)
        record.set('topics', data.topics)
        record.set('bio', data.bio)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('instructors', '1=1', '', 100, 0)
      for (const r of records) app.delete(r)
    } catch (_) {}
  },
)
