migrate(
  (app) => {
    const regCol = app.findCollectionByNameOrId('event_registrations')
    if (!regCol.fields.getByName('company_name')) {
      regCol.fields.add(new TextField({ name: 'company_name' }))
      app.save(regCol)
    }

    const invCol = app.findCollectionByNameOrId('workshop_invitations')
    if (invCol && !invCol.fields.getByName('guest_email')) {
      invCol.fields.add(new EmailField({ name: 'guest_email' }))
      app.save(invCol)
    }
  },
  (app) => {
    const regCol = app.findCollectionByNameOrId('event_registrations')
    if (regCol && regCol.fields.getByName('company_name')) {
      regCol.fields.removeByName('company_name')
      app.save(regCol)
    }

    const invCol = app.findCollectionByNameOrId('workshop_invitations')
    if (invCol && invCol.fields.getByName('guest_email')) {
      invCol.fields.removeByName('guest_email')
      app.save(invCol)
    }
  },
)
