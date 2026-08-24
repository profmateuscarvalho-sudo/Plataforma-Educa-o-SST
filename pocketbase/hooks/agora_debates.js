// Ao criar um debate, publica automaticamente no Quadro de Avisos (platform_announcements)
onRecordAfterCreateSuccess((e) => {
  try {
    var debate = e.record
    var tema = debate.getString('tema')
    var moderadorId = debate.getString('moderador_id')
    var categoriaTags = debate.getString('categoria_tags') || ''
    var dataTermino = debate.getString('data_termino')
    var debateId = debate.id

    var moderadorNome = 'Moderador'
    var moderadorEmail = ''
    try {
      var modUser = $app.findRecordById('users', moderadorId)
      if (modUser) {
        moderadorNome = modUser.getString('name') || modUser.getString('email') || 'Moderador'
        moderadorEmail = modUser.getString('email')
      }
    } catch (_) {}

    var terminoFormatado = ''
    if (dataTermino) {
      try {
        var d = new Date(dataTermino)
        terminoFormatado = d.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch (_) {
        terminoFormatado = dataTermino
      }
    }

    var contentHtml =
      '<p><strong>🏛️ Novo Debate na Ágora:</strong> ' +
      tema +
      '</p>' +
      '<p><strong>Moderador:</strong> ' +
      moderadorNome +
      (categoriaTags ? ' | <strong>Tags:</strong> ' + categoriaTags : '') +
      '</p>' +
      (terminoFormatado
        ? '<p><strong>Encerramento em:</strong> ' + terminoFormatado + '</p>'
        : '') +
      '<p><a href="/plataforma/agora/' +
      debateId +
      '" style="display:inline-block;padding:6px 12px;background:#C17A4E;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:4px;">Entrar no Debate</a></p>'

    var announcementsCol = $app.findCollectionByNameOrId('platform_announcements')
    var notice = new Record(announcementsCol)
    notice.set('title', '🏛️ Novo debate: ' + tema)
    notice.set('content', contentHtml)
    notice.set('type', 'Ágora de Debates')
    notice.set('reference_id', debateId)
    notice.set('active', true)
    notice.set('priority', 5)
    $app.save(notice)
  } catch (err) {
    $app.logger().error('Failed to create announcement for agora debate', 'error', err.message)
  }
  e.next()
}, 'agora_debates')

// Atualiza contagem de apoios quando um apoio for criado ou excluído
onRecordAfterCreateSuccess((e) => {
  try {
    var votoId = e.record.getString('voto_id')
    if (votoId) {
      var count = $app.countRecords('agora_apoios', 'voto_id = "' + votoId + '"')
      var voto = $app.findRecordById('agora_votos', votoId)
      if (voto) {
        voto.set('apoios', count)
        $app.save(voto)
      }
    }
  } catch (err) {
    $app.logger().warn('Failed to update apoios count on create', 'error', err.message)
  }
  e.next()
}, 'agora_apoios')

onRecordAfterDeleteSuccess((e) => {
  try {
    var votoId = e.record.getString('voto_id')
    if (votoId) {
      var count = $app.countRecords('agora_apoios', 'voto_id = "' + votoId + '"')
      var voto = $app.findRecordById('agora_votos', votoId)
      if (voto) {
        voto.set('apoios', count)
        $app.save(voto)
      }
    }
  } catch (err) {
    $app.logger().warn('Failed to update apoios count on delete', 'error', err.message)
  }
  e.next()
}, 'agora_apoios')

// Cron para verificar encerramento automático dos debates passados
cronAdd('agora_auto_close', '*/15 * * * *', () => {
  try {
    var nowIso = new Date().toISOString()
    var expiredDebates = $app.findRecordsByFilter(
      'agora_debates',
      'status != "encerrado" && data_termino <= "' + nowIso + '"',
      'created',
      100,
      0,
    )

    for (var i = 0; i < expiredDebates.length; i++) {
      var debate = expiredDebates[i]
      debate.set('status', 'encerrado')
      $app.save(debate)

      // Notifica o moderador para preencher conclusões
      var modId = debate.getString('moderador_id')
      if (modId) {
        try {
          var mod = $app.findRecordById('users', modId)
          var modEmail = mod ? mod.getString('email') : ''
          var modName = mod ? mod.getString('name') : 'Moderador'
          if (modEmail) {
            var mailClient = $app.newMailClient()
            var msg = new mailer.Message({
              from: {
                address: 'no-reply@educacaosst.com',
                name: 'Ágora de Debates - Educação SST',
              },
              to: [{ address: modEmail, name: modName }],
              subject: '🏛️ Seu debate na Ágora foi encerrado: Preencha as Conclusões',
              html:
                '<div style="font-family:sans-serif;color:#1e293b;max-width:600px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#FAF8F3;">' +
                '<h2 style="color:#C17A4E;margin-top:0;">🏛️ Ágora de Debates</h2>' +
                '<p>Olá <strong>' +
                modName +
                '</strong>,</p>' +
                '<p>O debate <strong>"' +
                debate.getString('tema') +
                '"</strong> atingiu a data de término e foi encerrado automaticamente.</p>' +
                '<p>Como moderador, você já pode acessar a sala e registrar as <strong>conclusões gerais</strong> e os <strong>principais aprendizados</strong> para enriquecer a biblioteca da comunidade.</p>' +
                '<p style="margin:24px 0;"><a href="' +
                ($os.getenv('SITE_URL') || 'https://educacaosst.com') +
                '/plataforma/agora/' +
                debate.id +
                '" style="display:inline-block;padding:12px 24px;background:#C17A4E;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Acessar Sala e Publicar Conclusões</a></p>' +
                '<p style="color:#64748b;font-size:13px;">Educação SST — Excelência em Segurança e Saúde no Trabalho</p>' +
                '</div>',
            })
            mailClient.send(msg)
          }
        } catch (mailErr) {
          $app.logger().warn('Failed to send closing email to moderator', 'error', mailErr.message)
        }
      }
    }
  } catch (err) {
    $app.logger().error('Agora auto close cron error', 'error', err.message)
  }
})
