onRecordValidate((e) => {
  const record = e.record
  const eventId = record.getString('event')
  const speakerName = record.getString('speaker_name')

  if (eventId && speakerName) {
    try {
      const event = $app.findRecordById('events', eventId)
      const speakersRaw = event.get('speakers')

      let speakers = []
      if (Array.isArray(speakersRaw)) {
        speakers = speakersRaw
      } else if (typeof speakersRaw === 'string' && speakersRaw) {
        try {
          speakers = JSON.parse(speakersRaw)
        } catch (_) {}
      }

      let isValid = false
      for (let i = 0; i < speakers.length; i++) {
        if (speakers[i] && speakers[i].name === speakerName) {
          isValid = true
          break
        }
      }

      if (!isValid && speakers.length > 0) {
        const errors = {}
        const { ValidationError } = require('pocketbase')
        errors['speaker_name'] = new ValidationError(
          'invalid_speaker',
          'Palestrante inválido para este evento.',
        )
        throw new BadRequestError('Palestrante inválido', errors)
      }
    } catch (err) {
      if (err.name === 'BadRequestError') throw err
      // ignore other errors like event not found, handled by standard relations
    }
  }
  e.next()
}, 'live_messages')
