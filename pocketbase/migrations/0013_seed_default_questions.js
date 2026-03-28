migrate(
  (app) => {
    const defaultQuestions = [
      'Qual a sua maior conquista na área de SST?',
      'Como você enxerga o futuro da Segurança do Trabalho?',
      'Que conselho daria para quem está começando na área?',
      'Qual foi o maior desafio que já enfrentou em sua carreira?',
      'Deixe uma mensagem final para os leitores da revista.',
    ]

    const magazines = app.findRecordsByFilter('magazines', '1=1', '', 1000, 0)
    for (let mag of magazines) {
      mag.set('connection_questions', defaultQuestions)
      app.saveNoValidate(mag)
    }
  },
  (app) => {},
)
