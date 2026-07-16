routerAdd(
  'DELETE',
  '/backend/v1/admin/students/{userId}',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores')
    }

    var userId = e.request.pathValue('userId')
    if (!userId) return e.badRequestError('userId é obrigatório')

    var collections = [
      'lesson_completions',
      'lesson_ratings',
      'student_notes',
      'support_messages',
      'subscriptions',
      'payments',
      'email_logs',
      'simulado_submissions',
      'live_messages',
    ]

    for (var c = 0; c < collections.length; c++) {
      try {
        var records = $app.findRecordsByFilter(collections[c], "user = '" + userId + "'")
        for (var i = 0; i < records.length; i++) {
          $app.delete(records[i])
        }
      } catch (_) {}
    }

    try {
      var caseLikes = $app.findRecordsByFilter('case_likes', "user = '" + userId + "'")
      for (var j = 0; j < caseLikes.length; j++) {
        $app.delete(caseLikes[j])
      }
    } catch (_) {}

    try {
      var caseComments = $app.findRecordsByFilter('case_comments', "user = '" + userId + "'")
      for (var k = 0; k < caseComments.length; k++) {
        $app.delete(caseComments[k])
      }
    } catch (_) {}

    try {
      var cases = $app.findRecordsByFilter('professional_cases', "user = '" + userId + "'")
      for (var m = 0; m < cases.length; m++) {
        $app.delete(cases[m])
      }
    } catch (_) {}

    try {
      var user = $app.findRecordById('users', userId)
      $app.delete(user)
    } catch (_) {
      return e.notFoundError('Usuário não encontrado')
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
