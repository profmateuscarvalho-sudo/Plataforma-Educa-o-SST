onRecordAfterCreateSuccess((e) => {
  var entry = e.record
  var entryId = entry.id
  var entryType = entry.getString('type')
  var rawText = entry.getString('raw_text') || ''
  var tagsRaw = entry.get('tags')
  var tagsStr = tagsRaw ? (typeof tagsRaw === 'string' ? tagsRaw : JSON.stringify(tagsRaw)) : '[]'

  // --- Helper: extract textual content from a parsed JSON value ---
  // Walks objects/arrays and collects title-like + content-like string fields
  // into coherent text blocks suitable for embedding.
  function extractTextFromJson(node) {
    var blocks = []
    var titleKeys = {
      title: true,
      titulo: true,
      name: true,
      nome: true,
      heading: true,
      pergunta: true,
      question: true,
      subject: true,
      assunto: true,
    }
    var contentKeys = {
      content: true,
      conteudo: true,
      description: true,
      descricao: true,
      text: true,
      texto: true,
      body: true,
      corpo: true,
      answer: true,
      resposta: true,
      answer_text: true,
      summary: true,
      resumo: true,
      message: true,
      mensagem: true,
      explanation: true,
      explicacao: true,
      context: true,
      contexto: true,
    }
    function isObj(v) {
      return v !== null && typeof v === 'object' && !Array.isArray(v)
    }
    function walk(v) {
      if (Array.isArray(v)) {
        for (var i = 0; i < v.length; i++) walk(v[i])
        return
      }
      if (isObj(v)) {
        var titles = []
        var contents = []
        for (var k in v) {
          var lk = (k || '').toLowerCase()
          var val = v[k]
          if (typeof val === 'string' && val.trim()) {
            if (titleKeys[lk]) titles.push(val.trim())
            else if (contentKeys[lk]) contents.push(val.trim())
          }
        }
        if (titles.length || contents.length) {
          var block = ''
          if (titles.length) block += titles.join(' / ')
          if (contents.length) block += (block ? '\n' : '') + contents.join('\n')
          if (block) blocks.push(block)
        }
        for (var k2 in v) walk(v[k2])
      }
    }
    walk(node)
    // Fallback: if nothing matched known keys, collect all non-empty strings
    if (blocks.length === 0) {
      function collectStrings(v) {
        if (typeof v === 'string') {
          if (v.trim().length > 3) blocks.push(v.trim())
        } else if (Array.isArray(v)) {
          for (var j = 0; j < v.length; j++) collectStrings(v[j])
        } else if (isObj(v)) {
          for (var kk in v) collectStrings(v[kk])
        }
      }
      collectStrings(node)
    }
    return blocks
  }

  // --- type: link -> fetch URL content (retrocompatible) ---
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
        entry.set(
          'error_message',
          'Falha ao buscar conteudo da URL. Verifique se o link esta acessivel.',
        )
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

  // --- type: json -> extract textual content from json_data ---
  if (entryType === 'json' && !rawText) {
    var jsonStr = entry.getString('json_data') || ''
    if (!jsonStr.trim()) {
      entry.set('status', 'failed')
      entry.set('error_message', 'Nenhum conteudo JSON fornecido.')
      $app.saveNoValidate(entry)
      return e.next()
    }
    var parsed
    try {
      parsed = JSON.parse(jsonStr)
    } catch (jerr) {
      entry.set('status', 'failed')
      entry.set('error_message', 'JSON invalido: ' + jerr.message)
      $app.saveNoValidate(entry)
      return e.next()
    }
    var jsonBlocks = extractTextFromJson(parsed)
    rawText = jsonBlocks.join('\n\n')
    if (!rawText || rawText.trim().length === 0) {
      entry.set('status', 'failed')
      entry.set(
        'error_message',
        'Nenhum conteudo textual extraido do JSON. Inclua campos como title, content, description, question, answer, etc.',
      )
      $app.saveNoValidate(entry)
      return e.next()
    }
    entry.set('raw_text', rawText)
  }

  if (!rawText || rawText.trim().length === 0) {
    var errMsg = 'Nenhum texto fornecido para processamento.'
    if (entryType === 'pdf')
      errMsg = 'PDF sem texto extraivel. Insira o conteudo manualmente como texto livre.'
    if (entryType === 'image')
      errMsg =
        'Nenhuma descricao textual fornecida para a imagem. Forneça o texto visivel na imagem.'
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
    entry.set('error_message', 'Nenhum chunk gerado a partir do texto.')
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
      $app
        .logger()
        .error('Failed to embed chunk', 'entry', entryId, 'chunk', j, 'error', err.message)
    }
  }

  if (successCount === 0) {
    entry.set('status', 'failed')
    entry.set('error_message', 'Falha ao gerar embeddings. Tente reprocessar.')
  } else {
    entry.set('status', 'completed')
    entry.set('error_message', '')
  }
  $app.saveNoValidate(entry)
  return e.next()
}, 'knowledge_entries')
