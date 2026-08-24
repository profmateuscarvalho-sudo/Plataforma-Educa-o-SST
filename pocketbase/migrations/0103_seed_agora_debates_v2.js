migrate(
  (app) => {
    try {
      var user = app.findFirstRecordByFilter('users', 'role = "admin" || id != ""', '-created')
      if (!user) {
        console.log('No user found for agora debates seed')
        return
      }

      var debatesCol = app.findCollectionByNameOrId('agora_debates')
      var votosCol = app.findCollectionByNameOrId('agora_votos')

      var existing = app.findRecordsByFilter('agora_debates', 'status != ""', '-created', 1, 0)
      if (existing.length > 0) return

      var now = new Date()
      // Use YYYY-MM-DD HH:MM:SS.sssZ format or ISO string supported by PocketBase
      var startDate = new Date(now.getTime() - 2 * 86400000).toISOString().replace('T', ' ')
      var endDate = new Date(now.getTime() + 5 * 86400000).toISOString().replace('T', ' ')

      var debate1 = new Record(debatesCol)
      debate1.set(
        'tema',
        'Uso obrigatório de trava-quedas retrátil em trabalhos acima de 4 metros: viabilidade técnica e custo',
      )
      debate1.set(
        'descricao',
        'Com as constantes revisões da NR-35 e o avanço dos sistemas de proteção contra quedas, discute-se se a exigência generalizada de trava-quedas retrátil para qualquer atividade acima de 4 metros é técnica e financeiramente viável para pequenas e médias empresas, ou se o talabarte duplo com absorvedor de energia continua sendo suficiente quando a ZLC (Zona Livre de Queda) é respeitada.',
      )
      debate1.set('categoria_tags', 'NR-35, Trabalho em Altura, EPI, Gestão de Risco')
      debate1.set('data_inicio', startDate)
      debate1.set('data_termino', endDate)
      debate1.set(
        'regras_conduta',
        '1. Respeite todos os participantes. 2. Argumente com base técnica e normativa. 3. Evite ataques pessoais. 4. Cite fontes sempre que possível.',
      )
      debate1.set('moderador_id', user.id)
      debate1.set('status', 'em_andamento')
      app.save(debate1)

      var debate2 = new Record(debatesCol)
      debate2.set(
        'tema',
        'PGR e eSocial S-2240: Laudo de Insalubridade deve ser pré-requisito mandatório?',
      )
      debate2.set(
        'descricao',
        'Muitas consultorias e profissionais de SST enfrentam dúvidas na elaboração do evento S-2240 do eSocial sem que a empresa tenha concluído ou atualizado o Laudo de Insalubridade (NR-15) e o LTCAT (Lei 8.213/91). Qual é a sua conduta profissional quando o cliente quer enviar o evento apenas com base no PGR?',
      )
      debate2.set('categoria_tags', 'PGR, eSocial, Legislação, NR-01, NR-15')
      debate2.set('data_inicio', startDate)
      debate2.set('data_termino', endDate)
      debate2.set(
        'regras_conduta',
        '1. Respeite todos os participantes. 2. Argumente com base técnica e normativa. 3. Evite ataques pessoais. 4. Cite fontes sempre que possível.',
      )
      debate2.set('moderador_id', user.id)
      debate2.set('status', 'em_andamento')
      app.save(debate2)

      var voto1 = new Record(votosCol)
      voto1.set('debate_id', debate1.id)
      voto1.set('usuario_id', user.id)
      voto1.set('posicao', 'complementacao')
      voto1.set(
        'justificativa',
        'A escolha do dispositivo deve obrigatoriamente decorrer da análise de risco e do cálculo rigoroso da Zona Livre de Queda (ZLC). Em pontos de ancoragem baixos, o trava-quedas retrátil reduz drasticamente a distância de desaceleração, salvando vidas onde o talabarte tradicional tocaria o piso.',
      )
      voto1.set('apoios', 3)
      app.save(voto1)
    } catch (err) {
      console.log('Seed agora debates 0103 error:', err && err.message ? err.message : err)
    }
  },
  (app) => {
    try {
      var debates = app.findRecordsByFilter('agora_debates', 'status != ""', '-created', 10, 0)
      for (var i = 0; i < debates.length; i++) {
        app.delete(debates[i])
      }
    } catch (_) {}
  },
)
