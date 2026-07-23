routerAdd(
  'POST',
  '/backend/v1/knowledge/search',
  (e) => {
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')
    try {
      var user = $app.findRecordById('users', userId)
      if (user.getString('role') !== 'admin') return e.forbiddenError('admin only')
    } catch (_) {
      return e.forbiddenError('admin only')
    }

    var body = e.requestInfo().body || {}
    var query = (body.query || '').trim()
    if (!query) return e.badRequestError('query is required')

    var tags = body.tags || []
    var topK = body.topK || 5
    if (topK < 1) topK = 5
    if (topK > 50) topK = 50

    var embedRes
    try {
      embedRes = $ai.embed({ input: query })
    } catch (err) {
      return e.json(500, { error: 'Failed to generate query embedding' })
    }

    var searchK = tags && tags.length > 0 ? topK * 5 : topK
    var results
    try {
      results = $vectors.search(e, 'knowledge_chunks', {
        field: 'embedding',
        query: embedRes.data[0].embedding,
        k: searchK,
      })
    } catch (_) {
      return e.json(200, [])
    }

    var output = []
    for (var i = 0; i < results.items.length; i++) {
      var item = results.items[i]
      if (tags && tags.length > 0) {
        var itemTags = item.get('tags')
        if (typeof itemTags === 'string') {
          try {
            itemTags = JSON.parse(itemTags)
          } catch (_) {
            itemTags = []
          }
        }
        if (!Array.isArray(itemTags)) itemTags = []
        var hasAll = true
        for (var t = 0; t < tags.length; t++) {
          if (itemTags.indexOf(tags[t]) === -1) {
            hasAll = false
            break
          }
        }
        if (!hasAll) continue
      }

      var entryTitle = ''
      try {
        var entryRec = $app.findRecordById('knowledge_entries', item.getString('entry'))
        entryTitle = entryRec.getString('title')
      } catch (_) {}

      var dist = item._distance || 0
      var parsedTags = item.get('tags')
      if (typeof parsedTags === 'string') {
        try {
          parsedTags = JSON.parse(parsedTags)
        } catch (_) {
          parsedTags = []
        }
      }
      if (!Array.isArray(parsedTags)) parsedTags = []

      output.push({
        text: item.getString('chunk_text'),
        score: 1 - dist,
        title: entryTitle,
        tags: parsedTags,
      })
      if (output.length >= topK) break
    }

    return e.json(200, output)
  },
  $apis.requireAuth(),
)
