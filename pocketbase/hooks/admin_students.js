routerAdd(
  'GET',
  '/backend/v1/admin/students',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores')
    }

    try {
      var records = $app.findRecordsByFilter(
        'users',
        "role != 'admin'",
        '-created',
        5000,
        0,
      )

      var students = []
      for (var i = 0; i < records.length; i++) {
        var r = records[i]
        students.push({
          id: r.id,
          name: r.getString('name'),
          email: r.getString('email'),
          phone: r.getString('phone'),
          avatar: r.getString('avatar'),
          role: r.getString('role'),
          plan_tier: r.getString('plan_tier'),
          contract_end_date: r.getString('contract_end_date'),
          professional_profile: r.getString('professional_profile'),
          professional_tags: r.getStringSlice ? r.getStringSlice('professional_tags') : (r.get('professional_tags') || []),
          city: r.getString('city'),
          state: r.getString('state'),
          email_verificado: r.getBool('email_verificado'),
          verified: r.getBool('verified'),
          created: r.getString('created'),
          updated: r.getString('updated'),
        })
      }

      return e.json(200, students)
    } catch (err) {
      $app.logger().error('Failed to list admin students', 'error', err.message)
      return e.json(500, { error: 'Erro ao carregar lista de alunos' })
    }
  },
  $apis.requireAuth(),
)
