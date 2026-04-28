migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('doc_projects')

    // Add new fields for investor pitch
    col.fields.add(new EditorField({ name: 'methodology' }))
    col.fields.add(new NumberField({ name: 'investment_quota' }))
    col.fields.add(
      new FileField({
        name: 'presentation_photos',
        maxSelect: 10,
        maxSize: 10485760,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    col.fields.add(new TextField({ name: 'slug' }))

    // Ensure collection is publicly viewable for the landing page
    col.viewRule = ''
    col.listRule = ''

    app.save(col)

    // Populate empty slugs with ID to avoid unique constraint failure on existing records
    app.db().newQuery("UPDATE doc_projects SET slug = id WHERE slug IS NULL OR slug = ''").execute()

    // Create unique index for slug
    col.addIndex('idx_doc_projects_slug', true, 'slug', '')
    app.save(col)

    // Ensure costs and team are publicly viewable as well
    const costsCol = app.findCollectionByNameOrId('doc_project_costs')
    if (costsCol.viewRule !== '') {
      costsCol.viewRule = ''
      app.save(costsCol)
    }

    const teamCol = app.findCollectionByNameOrId('doc_project_team')
    if (teamCol.viewRule !== '') {
      teamCol.viewRule = ''
      app.save(teamCol)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('doc_projects')
    col.removeIndex('idx_doc_projects_slug')
    col.fields.removeByName('methodology')
    col.fields.removeByName('investment_quota')
    col.fields.removeByName('presentation_photos')
    col.fields.removeByName('slug')
    app.save(col)
  },
)
