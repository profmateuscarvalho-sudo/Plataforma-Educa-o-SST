onRecordAfterUpdateSuccess((e) => {
  var newVerified = e.record.getBool('verified')
  var oldVerified = e.record.original().getBool('verified')

  if (newVerified && !oldVerified) {
    try {
      var userRecord = $app.findRecordById('users', e.record.id)
      if (!userRecord.getBool('email_verificado')) {
        userRecord.set('email_verificado', true)
        $app.saveNoValidate(userRecord)
        $app.logger().info('email_verificado set to true', 'userId', e.record.id)
      }
    } catch (err) {
      $app
        .logger()
        .error('Failed to set email_verificado', 'error', err.message, 'userId', e.record.id)
    }
  }

  return e.next()
}, 'users')
