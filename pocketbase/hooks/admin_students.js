// Lista alunos para o painel de acessos/admin, com e-mail visível só para
// admins. Paginado no servidor (page/per_page na query, 50 por padrão) —
// antes baixava até 5000 registros numa chamada e saturava o JSVM, atrasando
// todas as outras requisições do backend na mesma janela.
routerAdd(
  'GET',
  '/backend/v1/admin/students',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Acesso restrito a administradores')
    }

    try {
      var q = e.request.url.query()
      var page = parseInt(q.get('page') || '1', 10)
      var perPage = parseInt(q.get('per_page') || '50', 10)
      if (isNaN(page) || page < 1) page = 1
      if (isNaN(perPage) || perPage < 1 || perPage > 200) perPage = 50
      var search = (q.get('search') || '').trim()
      // Sanitiza aspas para não quebrar o filtro do PocketBase.
      search = search.replace(/["\\]/g, '')

      var filter = "role != 'admin'"
      if (search !== '') {
        filter =
          "role != 'admin' && (name ~ \"" +
          search +
          '" || email ~ "' +
          search +
          '" || phone ~ "' +
          search +
          '")'
      }

      var records = $app.findRecordsByFilter(
        'users',
        filter,
        '-created',
        perPage,
        (page - 1) * perPage,
      )
      // countRecords(col, string) lança TypeError no JSVM (só aceita $dbx.exp);
      // contagem paginada com o MESMO filtro PB das linhas.
      var total = 0
      for (;;) {
        var pgTotal = $app.findRecordsByFilter('users', filter, '-created', 500, total)
        total += pgTotal.length
        if (pgTotal.length < 500) break
      }

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
          professional_tags: r.get('professional_tags') || [],
          city: r.getString('city'),
          state: r.getString('state'),
          email_verificado: r.getBool('email_verificado'),
          verified: r.getBool('verified'),
          created: r.getString('created'),
          updated: r.getString('updated'),
        })
      }

      return e.json(200, {
        page: page,
        per_page: perPage,
        totalItems: total,
        totalPages: Math.ceil(total / perPage),
        items: students,
      })
    } catch (err) {
      // console.* é o que aparece no stream de hooks (não $app.logger())
      console.error('admin_students: falha na listagem:', err && err.message ? err.message : err)
      return e.json(500, { error: 'Erro ao carregar lista de alunos' })
    }
  },
  $apis.requireAuth(),
)
