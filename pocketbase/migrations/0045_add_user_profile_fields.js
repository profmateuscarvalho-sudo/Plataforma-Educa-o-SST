migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('phone')) {
      col.fields.add(new TextField({ name: 'phone' }))
    }

    if (!col.fields.getByName('professional_profile')) {
      col.fields.add(
        new SelectField({
          name: 'professional_profile',
          values: [
            'Estudante',
            'Técnico em Segurança',
            'Engenheiro de Segurança',
            'Enfermeiro do Trabalho',
            'Médico do Trabalho',
            'Outros',
          ],
          maxSelect: 1,
        }),
      )
    }

    col.listRule = "id = @request.auth.id || @request.auth.role = 'admin'"
    col.viewRule = "id = @request.auth.id || @request.auth.role = 'admin'"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.listRule = 'id = @request.auth.id'
    col.viewRule = 'id = @request.auth.id'
    app.save(col)
  },
)
