migrate(
  (app) => {
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'carvalhomateus@icloud.com')
    } catch (_) {
      return
    }

    const casesCol = app.findCollectionByNameOrId('professional_cases')

    try {
      app.findFirstRecordByData(
        'professional_cases',
        'title',
        'Identificação de risco químico em indústria de produtos de limpeza',
      )
      return
    } catch (_) {}

    const caseRecord = new Record(casesCol)
    caseRecord.set('user', user.id)
    caseRecord.set('title', 'Identificação de risco químico em indústria de produtos de limpeza')
    caseRecord.set(
      'content',
      '<p>Durante uma inspeção em uma fábrica de produtos de limpeza, identifiquei que os funcionários do setor de mistura não utilizavam EPI adequado para manipulação de soda cáustica e ácido sulfúrico. O mapa de risco da empresa não contemplava esses agentes químicos. Como abordar a conscientização da gerência sobre a importância da atualização do PGR e fornecimento de EPI compatível?</p>',
    )
    app.save(caseRecord)

    const commentsCol = app.findCollectionByNameOrId('case_comments')
    const commentRecord = new Record(commentsCol)
    commentRecord.set('case', caseRecord.id)
    commentRecord.set('user', user.id)
    commentRecord.set(
      'content',
      'Excelente relato! Sugiro iniciar com uma avaliação quantitativa dos agentes químicos através do laudo técnico. Apresentar os riscos com dados concretos costuma facilitar a conscientização da gerência.',
    )
    app.save(commentRecord)
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('professional_cases', 'title != ""', '', 100, 0)
      for (const r of records) {
        app.delete(r)
      }
    } catch (_) {}
  },
)
