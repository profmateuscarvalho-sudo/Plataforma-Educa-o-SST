migrate(
  (app) => {
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'carvalhomateus@icloud.com')
    } catch (_) {
      return
    }

    const liveCol = app.findCollectionByNameOrId('live_sessions')
    const now = new Date()
    const session1Date = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const session2Date = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    try {
      app.findFirstRecordByData(
        'live_sessions',
        'title',
        'NR-15: Avaliação de Ruído Contínuo e Intermitente',
      )
    } catch (_) {
      const live1 = new Record(liveCol)
      live1.set('title', 'NR-15: Avaliação de Ruído Contínuo e Intermitente')
      live1.set(
        'description',
        'Aula prática sobre metodologia de avaliação de ruído ocupacional conforme NR-15.',
      )
      live1.set('status', 'scheduled')
      live1.set('scheduled_at', session1Date.toISOString())
      live1.set('instructor_name', 'Eng. Carlos Mendes')
      app.save(live1)
    }

    try {
      app.findFirstRecordByData(
        'live_sessions',
        'title',
        'Gestão de PGR: Integração com PPRA e PGR',
      )
    } catch (_) {
      const live2 = new Record(liveCol)
      live2.set('title', 'Gestão de PGR: Integração com PPRA e PGR')
      live2.set(
        'description',
        'Como integrar o Programa de Gerenciamento de Riscos com o PPRA existente.',
      )
      live2.set('status', 'scheduled')
      live2.set('scheduled_at', session2Date.toISOString())
      live2.set('instructor_name', 'Dra. Ana Paula Silva')
      app.save(live2)
    }

    const casesCol = app.findCollectionByNameOrId('professional_cases')
    const commentsCol = app.findCollectionByNameOrId('case_comments')
    const likesCol = app.findCollectionByNameOrId('case_likes')

    const seedCases = [
      {
        title: 'Acidente com máquina industrial: análise de causa raiz',
        content:
          '<p>Em uma metalúrgica, um operador sofreu lesão no membro superior ao operar uma prensa hidráulica sem a proteção adequada. A análise de causa raiz revelou que a proteção havia sido removida para agilizar a produção. Implementamos um sistema de intertravamento e treinamento obrigatório. Compartilho para discutir estratégias de conscientização sobre a não-remoção de dispositivos de segurança.</p>',
        comment:
          'Muito interessante! Já passei por situação semelhante e a chave foi o envolvimento da alta gestão desde o início.',
      },
      {
        title: 'Implementação de programa de ergonomia em escritório',
        content:
          '<p>Durante a implantação de um programa de ergonomia em um escritório com 200 funcionários, identificamos alto índice de queixas de dores musculoesqueléticas. A solução envolveu adequação de mobiliário, pausas para alongamento e campanha educativa. Os resultados após 6 meses mostraram redução de 40% nas queixas. Gostaria de trocar experiências sobre sustentabilidade de programas ergonômicos.</p>',
        comment:
          'Excelente iniciativa! A redução de 40% é significativa. Como vocês lidaram com a resistência inicial dos funcionários?',
      },
    ]

    for (const seed of seedCases) {
      try {
        app.findFirstRecordByData('professional_cases', 'title', seed.title)
      } catch (_) {
        const caseRecord = new Record(casesCol)
        caseRecord.set('user', user.id)
        caseRecord.set('title', seed.title)
        caseRecord.set('content', seed.content)
        app.save(caseRecord)

        const comment = new Record(commentsCol)
        comment.set('case', caseRecord.id)
        comment.set('user', user.id)
        comment.set('content', seed.comment)
        app.save(comment)

        const like = new Record(likesCol)
        like.set('case', caseRecord.id)
        like.set('user', user.id)
        app.save(like)
      }
    }
  },
  (app) => {
    const titles = [
      'NR-15: Avaliação de Ruído Contínuo e Intermitente',
      'Gestão de PGR: Integração com PPRA e PGR',
      'Acidente com máquina industrial: análise de causa raiz',
      'Implementação de programa de ergonomia em escritório',
    ]
    for (const title of titles) {
      try {
        const r = app.findFirstRecordByData('live_sessions', 'title', title)
        app.delete(r)
      } catch (_) {}
      try {
        const r = app.findFirstRecordByData('professional_cases', 'title', title)
        app.delete(r)
      } catch (_) {}
    }
  },
)
