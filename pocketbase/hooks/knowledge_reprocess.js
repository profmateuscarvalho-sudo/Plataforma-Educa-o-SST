routerAdd(
  'POST',
  '/backend/v1/knowledge/reprocess/{id}',
  (e) => {
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')
    try {
      var user = $app.findRecordById('users', userId)
      if (user.getString('role') !== 'admin') return e.forbiddenError('admin only')
    } catch (_) {
      return e.forbiddenError('admin only')
    }

    var id = e.request.pathValue('id')
    var entry
    try {
      entry = $app.findRecordById('knowledge_entries', id)
    } catch (_) {
      return e.notFoundError('entry not found')
    }

    try {
      var chunks = $app.findRecordsByFilter('knowledge_chunks', 'entry = "' + id + '"', '', 500, 0)
      for (var i = 0; i < chunks.length; i++) {
        $app.delete(chunks[i])
      }
    } catch (_) {}

    entry.set('status', 'processing')
    entry.set('error_message', '')
    $app.save(entry)

    try {
      var updated = $app.findRecordById('knowledge_entries', id)
      return e.json(200, {
        ok: true,
        status: updated.getString('status'),
        error_message: updated.getString('error_message'),
      })
    } catch (_) {
      return e.json(200, { ok: true, status: 'processing' })
    }
  },
  $apis.requireAuth(),
)
