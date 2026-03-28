migrate(
  (app) => {
    const authors = new Collection({
      name: 'authors',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
        { name: 'bio', type: 'text' },
        {
          name: 'photos',
          type: 'file',
          maxSelect: 3,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png'],
        },
        { name: 'status', type: 'select', values: ['pending', 'approved'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(authors)

    const articles = new Collection({
      name: 'articles',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'editor', required: true },
        { name: 'compliance_norms', type: 'bool' },
        { name: 'delivery_deadline', type: 'date' },
        {
          name: 'author',
          type: 'relation',
          required: true,
          collectionId: authors.id,
          maxSelect: 1,
        },
        {
          name: 'magazine',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('magazines').id,
          maxSelect: 1,
        },
        {
          name: 'article_photos',
          type: 'file',
          maxSelect: 10,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png'],
        },
        { name: 'image_authorization', type: 'json' },
        { name: 'article_authorization', type: 'json' },
        { name: 'status', type: 'select', values: ['draft', 'submitted', 'approved', 'rejected'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(articles)

    const profConn = new Collection({
      name: 'professional_connections',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'professional_name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'responses', type: 'json' },
        {
          name: 'photos',
          type: 'file',
          maxSelect: 5,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png'],
        },
        { name: 'edition_month', type: 'text' },
        { name: 'status', type: 'select', values: ['pending', 'approved'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(profConn)

    const tokens = new Collection({
      name: 'submission_tokens',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: '',
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'token', type: 'text', required: true },
        { name: 'type', type: 'select', values: ['article', 'connection'], required: true },
        { name: 'expires_at', type: 'date', required: true },
        { name: 'used', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_sub_tokens ON submission_tokens (token)'],
    })
    app.save(tokens)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('submission_tokens'))
    app.delete(app.findCollectionByNameOrId('professional_connections'))
    app.delete(app.findCollectionByNameOrId('articles'))
    app.delete(app.findCollectionByNameOrId('authors'))
  },
)
