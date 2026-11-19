migrate(
  (app) => {
    var logsCol = app.findCollectionByNameOrId('email_logs')
    var emailTypeField = null
    try {
      emailTypeField = logsCol.fields.getByName('email_type')
    } catch (_) {
      emailTypeField = null
    }

    if (emailTypeField && emailTypeField.values) {
      var values = emailTypeField.values || []
      var hasValue = false
      for (var i = 0; i < values.length; i++) {
        if (values[i] === 'password_reset') {
          hasValue = true
          break
        }
      }
      if (!hasValue) {
        values.push('password_reset')
        emailTypeField.values = values
        app.save(logsCol)
      }
    }
  },
  (app) => {
    var logsCol = app.findCollectionByNameOrId('email_logs')
    var emailTypeField = null
    try {
      emailTypeField = logsCol.fields.getByName('email_type')
    } catch (_) {
      emailTypeField = null
    }

    if (emailTypeField && emailTypeField.values) {
      var values = emailTypeField.values || []
      var newValues = []
      for (var j = 0; j < values.length; j++) {
        if (values[j] !== 'password_reset') {
          newValues.push(values[j])
        }
      }
      emailTypeField.values = newValues
      app.save(logsCol)
    }
  },
)
