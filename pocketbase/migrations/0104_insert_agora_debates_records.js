migrate(
  (app) => {
    try {
      var user = app.findFirstRecordByData('users', 'role', 'admin')
      if (!user) {
        user = app.findFirstRecordByData('users', 'email', 'carvalhomateus@icloud.com')
      }
      if (!user) {
        console.log('No user for seed 0104')
        return
      }

      var debatesCol = app.findCollectionByNameOrId('agora_debates')
      var votosCol = app.findCollectionByNameOrId('agora_votos')

      var now = new Date()
      var startDate = new Date(now.getTime() - 2 * 86400000).toISOString()
      var endDate = new Date(now.getTime() + 5 * 86400000).toISOString()

      // Insere debate 1
      var d1 = new Record(debatesCol)
      d1.set(
        'tema',
        'Uso obrigatório de trava-quedas retrátil em trabalhos acima de 4 metros: viabilidade técnica e custo',
      )
      d1.set(
        'descricao',
        'Com as constantes revisões da NR-35 e o avanço dos sistemas de proteção contra quedas, discute-se se a exigência generalizada de trava-quedas retrátil para qualquer atividade acima de 4 metros é técnica e financeiramente viável para pequenas e médias empresas, ou se o talabarte duplo com absorvedor de energia continua sendo suficiente quando a ZLC (Zona Livre de Queda) é respeitada.',
      )
      d1.set('categoria_tags', 'NR-35, Trabalho em Altura, EPI, Gestão de Risco')
      d1.set('data_inicio', startDate)
      d1.set('data_termino', endDate)
      d1.set(
        'regras_conduta',
        '1. Respeite todos os participantes.\n2. Argumente com base técnica e normativa.\n3. Evite ataques pessoais.\n4. Cite fontes sempre que possível.',
      )
      d1.set('moderador_id', user.id)
      d1.set('status', 'em_andamento')
      app.save(d1)

      // Insere debate 2
      var d2 = new Record(debatesCol)
      d2.set(
        'tema',
        'PGR e eSocial S-2240: Laudo de Insalubridade deve ser pré-requisito mandatório?',
      )
      d2.set(
        'descricao',
        'Muitas consultorias e profissionais de SST enfrentam dúvidas na elaboração do evento S-2240 do eSocial sem que a empresa tenha concluído ou atualizado o Laudo de Insalubridade (NR-15) e o LTCAT (Lei 8.213/91). Qual é a sua conduta profissional quando o cliente quer enviar o evento apenas com base no PGR?',
      )
      d2.set('categoria_tags', 'PGR, eSocial, Legislação, NR-01, NR-15')
      d2.set('data_inicio', startDate)
      d2.set('data_termino', endDate)
      d2.set(
        'regras_conduta',
        '1. Respeite todos os participantes.\n2. Argumente com base técnica e normativa.\n3. Evite ataques pessoais.\n4. Cite fontes sempre que possível.',
      )
      d2.set('moderador_id', user.id)
      d2.set('status', 'em_andamento')
      app.save(d2)

      // Insere voto no debate 1
      var v1 = new Record(votosCol)
      v1.set('debate_id', d1.id)
      v1.set('usuario_id', user.id)
      v1.set('posicao', 'complementacao')
      v1.set(
        'justificativa',
        'A escolha do dispositivo deve obrigatoriamente decorrer da análise de risco e do cálculo rigoroso da Zona Livre de Queda (ZLC). Em pontos de ancoragem baixos, o trava-quedas retrátil reduz drasticamente a distância de desaceleração, salvando vidas onde o talabarte tradicional tocaria o piso.',
      )
      v1.set('apoios', 3)
      app.save(v1)
    } catch (e) {
      console.log('Error seed 0104:', e)
    }
  },
  (app) => {
    try {
      app.db().newQuery('DELETE FROM agora_apoios').execute()
      app.db().newQuery('DELETE FROM agora_votos').execute()
      app.db().newQuery('DELETE FROM agora_debates').execute()
    } catch (_) {}
  },
)
