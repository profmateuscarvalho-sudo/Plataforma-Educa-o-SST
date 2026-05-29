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

      let isValid = speakerName === 'Painel Geral'
      if (!isValid) {
        for (let i = 0; i < speakers.length; i++) {
          if (speakers[i] && speakers[i].name === speakerName) {
            isValid = true
            break
          }
        }
      }

      if (!isValid && speakers.length > 0) {
        throw new BadRequestError('Palestrante inválido', {
          speaker_name: 'Palestrante inválido para este evento.',
        })
      }
    } catch (err) {
      if (err.name === 'BadRequestError') throw err
      // ignore other errors like event not found, handled by standard relations
    }
  }
  e.next()
}, 'live_messages')
