migrate(
  (app) => {
    app
      .db()
      .newQuery('UPDATE magazines SET is_free = 1 WHERE is_free IS NULL OR is_free = 0')
      .execute()
    app
      .db()
      .newQuery('UPDATE doc_projects SET is_free = 1 WHERE is_free IS NULL OR is_free = 0')
      .execute()

    const liveMsgCol = app.findCollectionByNameOrId('live_messages')
    if (liveMsgCol.fields.getByName('event')) {
      liveMsgCol.fields.removeByName('event')
      app.save(liveMsgCol)
    }

    var collectionsToDelete = [
      'doc_project_costs',
      'doc_project_recordings',
      'doc_project_team',
      'doc_project_tasks',
      'doc_project_guests',
      'event_registrations',
      'workshop_invitations',
      'events',
    ]
    for (var i = 0; i < collectionsToDelete.length; i++) {
      try {
        var col = app.findCollectionByNameOrId(collectionsToDelete[i])
        app.delete(col)
      } catch (e) {}
    }

    var docCol = app.findCollectionByNameOrId('doc_projects')

    try {
      docCol.removeIndex('idx_doc_projects_slug')
    } catch (e) {}

    var legacyFields = [
      'objectives',
      'target_audience',
      'estimated_duration',
      'episodes',
      'script_structure',
      'status',
      'notes',
      'responsible',
      'attachments',
      'total_budget',
      'methodology',
      'investment_quota',
      'slug',
      'estimated_release_date',
      'topics',
    ]
    for (var j = 0; j < legacyFields.length; j++) {
      if (docCol.fields.getByName(legacyFields[j])) {
        docCol.fields.removeByName(legacyFields[j])
      }
    }

    if (!docCol.fields.getByName('panda_video_id')) {
      docCol.fields.add(new TextField({ name: 'panda_video_id' }))
    }

    app.save(docCol)
  },
  (app) => {
    // Structural simplification is not fully reversible.
  },
)
