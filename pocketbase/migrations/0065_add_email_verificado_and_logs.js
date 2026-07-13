migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('email_verificado')) {
      usersCol.fields.add(new BoolField({ name: 'email_verificado' }))
    }
    app.save(usersCol)

    var subsCol = app.findCollectionByNameOrId('subscriptions')
    subsCol.listRule = "user = @request.auth.id || @request.auth.role = 'admin'"
    subsCol.viewRule = "user = @request.auth.id || @request.auth.role = 'admin'"
    app.save(subsCol)

    var subsColId = app.findCollectionByNameOrId('subscriptions').id

    var emailLogs = new Collection({
      name: 'email_logs',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'recipient_email', type: 'text', required: true },
        { name: 'recipient_name', type: 'text' },
        {
          name: 'email_type',
          type: 'select',
          required: true,
          values: [
            'lead',
            'activation_free',
            'activation_paid',
            'payment_confirmed',
            'upgrade',
            'brevo_sync',
          ],
          maxSelect: 1,
        },
        { name: 'sent', type: 'bool' },
        { name: 'sent_at', type: 'date' },
        { name: 'brevo_synced', type: 'bool' },
        { name: 'brevo_list_id', type: 'number' },
        { name: 'brevo_status', type: 'number' },
        { name: 'error_message', type: 'text' },
        { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'subscription', type: 'relation', collectionId: subsColId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_email_logs_email ON email_logs (recipient_email)',
        'CREATE INDEX idx_email_logs_created ON email_logs (created DESC)',
      ],
    })
    app.save(emailLogs)
  },
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (usersCol.fields.getByName('email_verificado')) {
      usersCol.fields.remove(usersCol.fields.getByName('email_verificado'))
    }
    app.save(usersCol)

    var subsCol = app.findCollectionByNameOrId('subscriptions')
    subsCol.listRule = 'user = @request.auth.id'
    subsCol.viewRule = 'user = @request.auth.id'
    app.save(subsCol)

    app.delete(app.findCollectionByNameOrId('email_logs'))
  },
)
