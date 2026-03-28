routerAdd(
  'POST',
  '/backend/v1/generate-link',
  (e) => {
    const body = e.requestInfo().body
    const type = body.type
    const recipientName = body.recipient_name || ''

    if (type !== 'article' && type !== 'connection') {
      return e.badRequestError('Invalid token type')
    }

    const token = $security.randomString(32)
    const expires = new Date()
    expires.setDate(expires.getDate() + 30) // Updated to 30 days expiration

    const collection = $app.findCollectionByNameOrId('submission_tokens')
    const record = new Record(collection)
    record.set('token', token)
    record.set('type', type)
    record.set('expires_at', expires.toISOString().replace('T', ' ').substring(0, 19) + 'Z')
    record.set('used', false)
    record.set('recipient_name', recipientName)

    $app.save(record)

    return e.json(200, { token })
  },
  $apis.requireAuth(),
)
