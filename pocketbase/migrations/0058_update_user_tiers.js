migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('plan_tier')) {
      col.fields.add(
        new SelectField({
          name: 'plan_tier',
          values: ['free', 'prata', 'ouro'],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('subscription_billing')) {
      col.fields.add(
        new SelectField({
          name: 'subscription_billing',
          values: ['monthly', 'yearly', 'none'],
          maxSelect: 1,
        }),
      )
    }

    col.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'"

    app.save(col)

    var users = app.findRecordsByFilter('_pb_users_auth_', '1=1', '', 10000, 0)
    for (var i = 0; i < users.length; i++) {
      var u = users[i]
      if (!u.getString('plan_tier')) {
        u.set('plan_tier', 'free')
        u.set('subscription_billing', 'none')
        app.saveNoValidate(u)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    if (col.fields.getByName('plan_tier')) {
      col.fields.removeByName('plan_tier')
    }
    if (col.fields.getByName('subscription_billing')) {
      col.fields.removeByName('subscription_billing')
    }
    col.updateRule = 'id = @request.auth.id'
    app.save(col)
  },
)
