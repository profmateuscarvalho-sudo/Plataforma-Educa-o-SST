routerAdd(
  'POST',
  '/backend/v1/agent/chat',
  async (e) => {
    var body = e.requestInfo().body || {}
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')
    if (!body.message || !body.message.trim()) return e.badRequestError('message is required')

    var user = $app.findRecordById('users', userId)
    var userRole = user.getString('role')
    var planTier = (user.getString('plan_tier') || 'free').toLowerCase()

    var limit = 10
    try {
      var limitsRecords = $app.findRecordsByFilter('agent_limits_config', '', '', 1, 0)
      if (limitsRecords.length > 0) {
        var config = limitsRecords[0]
        if (userRole === 'admin') {
          limit = 999999
        } else if (planTier === 'ouro') {
          limit = config.getInt('limit_ouro')
        } else if (planTier === 'prata') {
          limit = config.getInt('limit_prata')
        } else {
          limit = config.getInt('limit_free')
        }
      }
    } catch (_) {}

    var now = new Date()
    var monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
    var usedCount = 0
    try {
      var userMsgs = $app.findRecordsByFilter(
        'agent_messages',
        'user = "' + userId + '" && role = "user" && created >= "' + monthStart + '"',
        '',
        500,
        0,
      )
      usedCount = userMsgs.length
    } catch (_) {}

    if (userRole !== 'admin' && usedCount >= limit) {
      return e.json(403, {
        error:
          'Voce atingiu o limite de perguntas do seu plano. Faca um upgrade para continuar usando o Agente IA.',
        limit_reached: true,
      })
    }

    var agentConvId = null
    if (body.conversation_id) {
      try {
        var conv1 = $ai
          .agent('agente-ia-educacao-sst')
          .getOrCreateConversation({ user_id: userId, id: body.conversation_id })
        agentConvId = conv1.id
      } catch (_) {
        agentConvId = null
      }
    }
    if (!agentConvId) {
      try {
        var conv2 = $ai.agent('agente-ia-educacao-sst').getOrCreateConversation({ user_id: userId })
        agentConvId = conv2.id
      } catch (err) {
        $app.logger().error('Failed to create conversation', 'error', err.message)
        return e.json(500, {
          error: 'Ocorreu um erro ao processar sua pergunta. Tente novamente em alguns instantes.',
        })
      }
    }

    var msgsCol = $app.findCollectionByNameOrId('agent_messages')
    var userMsg = new Record(msgsCol)
    userMsg.set('user', userId)
    userMsg.set('content', body.message)
    userMsg.set('role', 'user')
    userMsg.set('conversation_id', agentConvId)
    $app.save(userMsg)

    var iter = $ai.agent('agente-ia-educacao-sst').chat({
      user_id: userId,
      conversation_id: agentConvId,
      message: body.message,
      stream: true,
    })

    e.response.header().set('Content-Type', 'text/event-stream')
    e.response.header().set('Cache-Control', 'no-cache')
    e.response.header().set('X-Conversation-Id', agentConvId)

    var fullContent = ''
    try {
      for (var chunk of iter) {
        $response.write(e, chunk)
        $response.flush(e)
        var text = ''
        if (typeof chunk === 'string') {
          text = chunk
        } else {
          try {
            text = new TextDecoder().decode(chunk)
          } catch (_) {
            text = ''
          }
        }
        var lines = text.split('\n')
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i]
          if (line.indexOf('data:') === 0) {
            var data = line.slice(5).trim()
            if (data && data !== '[DONE]') {
              try {
                var parsed = JSON.parse(data)
                if (parsed.content) fullContent += parsed.content
              } catch (_) {}
            }
          }
        }
      }
    } catch (err) {
      $app.logger().error('Agent streaming error', 'error', err.message)
      var errorEvent =
        'event: error\ndata: ' +
        JSON.stringify({
          message:
            'Ocorreu um erro ao processar sua pergunta. Tente novamente em alguns instantes.',
        }) +
        '\n\n'
      $response.write(e, errorEvent)
      $response.flush(e)
      return
    }

    if (fullContent) {
      try {
        var aiMsg = new Record(msgsCol)
        aiMsg.set('user', userId)
        aiMsg.set('content', fullContent)
        aiMsg.set('role', 'assistant')
        aiMsg.set('conversation_id', agentConvId)
        $app.save(aiMsg)
      } catch (err) {
        $app.logger().error('Failed to save assistant message', 'error', err.message)
      }
    }
  },
  $apis.requireAuth(),
)
