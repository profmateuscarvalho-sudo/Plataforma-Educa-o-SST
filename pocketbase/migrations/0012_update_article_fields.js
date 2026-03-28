migrate(
  (app) => {
    const articles = app.findCollectionByNameOrId('articles')

    const contentField = articles.fields.getByName('content')
    if (contentField) {
      contentField.required = false
    }

    if (!articles.fields.getByName('article_word_file')) {
      articles.fields.add(
        new FileField({
          name: 'article_word_file',
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
        }),
      )
    }

    if (!articles.fields.getByName('article_pdf_file')) {
      articles.fields.add(
        new FileField({
          name: 'article_pdf_file',
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: ['application/pdf'],
        }),
      )
    }

    if (!articles.fields.getByName('editorial_comments')) {
      articles.fields.add(new EditorField({ name: 'editorial_comments' }))
    }

    app.save(articles)

    const magazines = app.findCollectionByNameOrId('magazines')
    if (!magazines.fields.getByName('connection_questions')) {
      magazines.fields.add(new JSONField({ name: 'connection_questions' }))
    }
    app.save(magazines)
  },
  (app) => {
    const articles = app.findCollectionByNameOrId('articles')
    articles.fields.removeByName('article_word_file')
    articles.fields.removeByName('article_pdf_file')
    articles.fields.removeByName('editorial_comments')
    app.save(articles)

    const magazines = app.findCollectionByNameOrId('magazines')
    magazines.fields.removeByName('connection_questions')
    app.save(magazines)
  },
)
