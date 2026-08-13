/// Add is_public + shared_at to student_notes and score fields to simulado_submissions
migrate(
  (app) => {
    // 1. student_notes: add is_public (bool) + shared_at (date) and relax list/view rules
    //    so that shared notes are publicly readable.
    const notesCol = app.findCollectionByNameOrId('student_notes')
    if (!notesCol.fields.getByName('is_public')) {
      notesCol.fields.add(new BoolField({ name: 'is_public' }))
    }
    if (!notesCol.fields.getByName('shared_at')) {
      notesCol.fields.add(new DateField({ name: 'shared_at' }))
    }
    // Public can list/view only shared notes; owner still sees their own.
    notesCol.listRule = 'is_public = true || (@request.auth.id != "" && user = @request.auth.id)'
    notesCol.viewRule = 'is_public = true || (@request.auth.id != "" && user = @request.auth.id)'
    // create/update/delete remain owner-only.
    notesCol.createRule = '@request.auth.id != "" && user = @request.auth.id'
    notesCol.updateRule = '@request.auth.id != "" && user = @request.auth.id'
    notesCol.deleteRule = '@request.auth.id != "" && user = @request.auth.id'
    notesCol.addIndex('idx_student_notes_public', false, 'is_public', '')
    app.save(notesCol)

    // 2. simulado_submissions: add score + total + percentage + completed_at
    const subCol = app.findCollectionByNameOrId('simulado_submissions')
    if (!subCol.fields.getByName('score')) {
      subCol.fields.add(new NumberField({ name: 'score', onlyInt: true }))
    }
    if (!subCol.fields.getByName('total_questions')) {
      subCol.fields.add(new NumberField({ name: 'total_questions', onlyInt: true }))
    }
    if (!subCol.fields.getByName('percentage')) {
      subCol.fields.add(new NumberField({ name: 'percentage', onlyInt: true }))
    }
    if (!subCol.fields.getByName('completed_at')) {
      subCol.fields.add(new DateField({ name: 'completed_at' }))
    }
    // Allow owner to update their own submission (so we can record score on finish).
    subCol.updateRule =
      "@request.auth.role = 'admin' || (@request.auth.id != '' && user = @request.auth.id)"
    subCol.addIndex('idx_simulado_submissions_user', false, 'user', '')
    subCol.addIndex('idx_simulado_submissions_simulado', false, 'simulado', '')
    app.save(subCol)
  },
  (app) => {
    const notesCol = app.findCollectionByNameOrId('student_notes')
    try {
      notesCol.fields.removeByName('is_public')
    } catch (_) {}
    try {
      notesCol.fields.removeByName('shared_at')
    } catch (_) {}
    notesCol.listRule = '@request.auth.id != "" && user = @request.auth.id'
    notesCol.viewRule = '@request.auth.id != "" && user = @request.auth.id'
    try {
      notesCol.removeIndex('idx_student_notes_public')
    } catch (_) {}
    app.save(notesCol)

    const subCol = app.findCollectionByNameOrId('simulado_submissions')
    try {
      subCol.fields.removeByName('score')
    } catch (_) {}
    try {
      subCol.fields.removeByName('total_questions')
    } catch (_) {}
    try {
      subCol.fields.removeByName('percentage')
    } catch (_) {}
    try {
      subCol.fields.removeByName('completed_at')
    } catch (_) {}
    subCol.updateRule = null
    try {
      subCol.removeIndex('idx_simulado_submissions_user')
    } catch (_) {}
    try {
      subCol.removeIndex('idx_simulado_submissions_simulado')
    } catch (_) {}
    app.save(subCol)
  },
)
