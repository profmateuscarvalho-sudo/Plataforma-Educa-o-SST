onRecordAfterUpdateSuccess((e) => {
  var entry = e.record
  var status = entry.getString('status')

  if (status === 'processing') {
    var entryId = entry.id
    var entryType = entry.getString('type')
    var rawText = entry.getString('raw_text') || ''
    var tagsRaw = entry.get('tags')
    var tagsStr = tagsRaw ? (typeof tagsRaw === 'string' ? tagsRaw : JSON.stringify(tagsRaw)) : '[]'

    try {
      var oldChunks = $app.findRecordsByFilter(
        'knowledge_chunks',
        'entry = "' + entryId + '"',
        '',
        500,
        0,
      )
      for (var oi = 0; oi < oldChunks.length; oi++) {
        $app.delete(oldChunks[oi])
      }
    } catch (_) {}

    if (entryType === 'link' && !rawText) {
      var linkUrl = entry.getString('url')
      if (!linkUrl) {
        entry.set('status', 'failed')
        entry.set('error_message', 'URL nao fornecida.')
        $app.saveNoValidate(entry)
        return e.next()
      }
      try {
        var res = $http.send({ url: linkUrl, method: 'GET', timeout: 30 })
        if (res.statusCode !== 200) {
          entry.set('status', 'failed')
          entry.set('error_message', 'Falha ao buscar conteudo da URL. Codigo: ' + res.statusCode)
          $app.saveNoValidate(entry)
          return e.next()
        }
        var html = ''
        try {
          html = new TextDecoder().decode(res.body)
        } catch (_) {
          html = ''
        }
        html = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        html = html
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        var texts = []
        var regex = /<(?:p|h[1-6]|li|article)[^>]*>([\s\S]*?)<\/(?:p|h[1-6]|li|article)>/gi
        var match
        while ((match = regex.exec(html)) !== null) {
          var t = match[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim()
          if (t.length > 20) texts.push(t)
        }
        rawText = texts.join('\n\n')
        if (!rawText) {
          entry.set('status', 'failed')
          entry.set('error_message', 'Falha ao buscar conteudo da URL.')
          $app.saveNoValidate(entry)
          return e.next()
        }
        entry.set('raw_text', rawText)
      } catch (err) {
        entry.set('status', 'failed')
        entry.set('error_message', 'Erro ao buscar URL: ' + err.message)
        $app.saveNoValidate(entry)
        return e.next()
      }
    }

    if (!rawText || rawText.trim().length === 0) {
      var errMsg = 'Nenhum texto fornecido.'
      if (entryType === 'pdf')
        errMsg = 'PDF sem texto extraivel. Insira o conteudo manualmente como texto livre.'
      if (entryType === 'image') errMsg = 'Nenhuma descricao textual fornecida para a imagem.'
      entry.set('status', 'failed')
      entry.set('error_message', errMsg)
      $app.saveNoValidate(entry)
      return e.next()
    }

    var chunkSize = 2000
    var overlap = 200
    var paragraphs = rawText.split(/\n\s*\n/)
    var chunks = []
    var current = ''
    for (var i = 0; i < paragraphs.length; i++) {
      var para = paragraphs[i].trim()
      if (!para) continue
      if (current.length + para.length + 2 > chunkSize && current.length > 0) {
        chunks.push(current.trim())
        current = current.slice(-overlap) + '\n\n' + para
      } else {
        current = current ? current + '\n\n' + para : para
      }
      while (current.length > chunkSize * 1.5) {
        var cut = current.lastIndexOf('. ', chunkSize)
        if (cut < overlap) cut = chunkSize
        chunks.push(current.slice(0, cut).trim())
        current = current.slice(Math.max(0, cut - overlap))
      }
    }
    if (current.trim()) chunks.push(current.trim())
    if (chunks.length === 0) {
      entry.set('status', 'failed')
      entry.set('error_message', 'Nenhum chunk gerado.')
      $app.saveNoValidate(entry)
      return e.next()
    }
    if (chunks.length > 100) chunks = chunks.slice(0, 100)

    var chunksCol = $app.findCollectionByNameOrId('knowledge_chunks')
    var successCount = 0
    for (var j = 0; j < chunks.length; j++) {
      try {
        var embedRes = $ai.embed({ input: chunks[j] })
        var chunkRecord = new Record(chunksCol)
        chunkRecord.set('entry', entryId)
        chunkRecord.set('chunk_text', chunks[j])
        chunkRecord.set('embedding', embedRes.data[0].embedding)
        chunkRecord.set('tags', tagsStr)
        $app.saveNoValidate(chunkRecord)
        successCount++
      } catch (err) {
        $app.logger().error('Embed chunk failed', 'entry', entryId, 'error', err.message)
      }
    }
    if (successCount === 0) {
      entry.set('status', 'failed')
      entry.set('error_message', 'Falha ao gerar embeddings.')
    } else {
      entry.set('status', 'completed')
      entry.set('error_message', '')
    }
    $app.saveNoValidate(entry)
    return e.next()
  }

  if (status === 'completed') {
    var curTags = JSON.stringify(entry.get('tags'))
    var origTags = JSON.stringify(entry.original().get('tags'))
    if (curTags !== origTags) {
      try {
        var chunks2 = $app.findRecordsByFilter(
          'knowledge_chunks',
          'entry = "' + entry.id + '"',
          '',
          500,
          0,
        )
        for (var k = 0; k < chunks2.length; k++) {
          chunks2[k].set('tags', tagsStr || '[]')
          $app.saveNoValidate(chunks2[k])
        }
      } catch (_) {}
    }
  }
  return e.next()
}, 'knowledge_entries')
