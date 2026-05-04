migrate(
  (app) => {
    const articles = app.findCollectionByNameOrId('articles')
    articles.createRule = ''
    app.save(articles)

    const authors = app.findCollectionByNameOrId('authors')
    authors.createRule = ''
    app.save(authors)
  },
  (app) => {
    const articles = app.findCollectionByNameOrId('articles')
    articles.createRule = "@request.auth.role = 'admin'"
    app.save(articles)

    const authors = app.findCollectionByNameOrId('authors')
    authors.createRule = ''
    app.save(authors)
  },
)
