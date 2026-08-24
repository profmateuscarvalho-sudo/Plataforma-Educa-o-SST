routerAdd('GET', '/backend/v1/share/{type}/{id}', (e) => {
  const type = e.request.pathValue('type')
  const id = e.request.pathValue('id')
  const siteUrl = $secrets.get('SITE_URL') || 'https://www.educacaosst.com.br'
  const pbUrl = $secrets.get('PB_INSTANCE_URL') || siteUrl

  let title = 'Educação SST'
  let description =
    'Plataforma premium de cursos e mentorias em Segurança e Saúde no Trabalho (SST).'
  let image = 'https://img.usecurling.com/p/1200/630?q=workplace%20safety&color=green'
  let redirectUrl = siteUrl
  let ogType = 'website'

  try {
    if (type === 'noticias' || type === 'news') {
      const record = $app.findRecordById('news', id)
      title = record.getString('title')
      const content = record.getString('content') || ''
      let plainText = content
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
      description = plainText.substring(0, 155)
      if (plainText.length > 155) description += '...'

      const imgField = record.getString('image')
      if (imgField) {
        image =
          pbUrl + '/api/files/' + record.collectionId() + '/' + record.getId() + '/' + imgField
      } else {
        const galleryField = record.get('images')
        let firstImage = ''
        if (Array.isArray(galleryField) && galleryField.length > 0) {
          firstImage = galleryField[0]
        } else if (typeof galleryField === 'string' && galleryField.trim()) {
          try {
            const parsed = JSON.parse(galleryField)
            if (Array.isArray(parsed) && parsed.length > 0) firstImage = parsed[0]
          } catch (_) {
            firstImage = galleryField
          }
        }
        if (firstImage) {
          image =
            pbUrl + '/api/files/' + record.collectionId() + '/' + record.getId() + '/' + firstImage
        } else {
          image = 'https://img.usecurling.com/p/1200/630?q=industry%20safety&color=gray'
        }
      }
      redirectUrl = siteUrl + '/noticias/' + id
      ogType = 'article'
    } else if (type === 'cursos' || type === 'courses') {
      const record = $app.findRecordById('courses', id)
      title = record.getString('title')
      description = record.getString('description') || 'Curso de Segurança e Saúde no Trabalho.'
      const imgField = record.getString('thumbnail')
      if (imgField) {
        image =
          pbUrl + '/api/files/' + record.collectionId() + '/' + record.getId() + '/' + imgField
      } else {
        image = 'https://img.usecurling.com/p/1200/630?q=education%20course&color=green'
      }
      redirectUrl = siteUrl + '/cursos/' + id
      ogType = 'website'
    } else if (type === 'revistas' || type === 'magazines') {
      const record = $app.findRecordById('magazines', id)
      title = record.getString('title')
      description = record.getString('summary') || 'Edição da Revista SST.'
      const imgField = record.getString('thumbnail')
      if (imgField) {
        image =
          pbUrl + '/api/files/' + record.collectionId() + '/' + record.getId() + '/' + imgField
      } else {
        image = 'https://img.usecurling.com/p/1200/630?q=magazine%20cover&color=blue'
      }
      redirectUrl = siteUrl + '/revistas?revista=' + id
      ogType = 'website'
    } else if (type === 'agora' || type === 'debates') {
      if (id && id !== 'list' && id !== 'all') {
        const record = $app.findRecordById('agora_debates', id)
        title = '🏛️ Debate: ' + record.getString('tema')
        const content = record.getString('descricao') || ''
        let plainText = content
          .replace(/<[^>]*>?/gm, '')
          .replace(/&nbsp;/g, ' ')
          .trim()
        description = plainText.substring(0, 155)
        if (plainText.length > 155) description += '...'
        redirectUrl = siteUrl + '/plataforma/agora/' + id
      } else {
        title = 'Ágora de Debates | Educação SST'
        description = 'Participe dos debates técnicos de Segurança e Saúde no Trabalho.'
        redirectUrl = siteUrl + '/plataforma/agora'
      }
      image = 'https://img.usecurling.com/p/1200/630?q=greek%20forum%20debate&color=terracotta'
      ogType = 'website'
    } else if (type === 'simulados') {
      const record = $app.findRecordById('simulados', id)
      title = record.getString('title')
      const content = record.getString('description') || ''
      let plainText = content
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
      description = plainText.substring(0, 155)
      if (plainText.length > 155) description += '...'
      const imgField = record.getString('banner')
      if (imgField) {
        image =
          pbUrl + '/api/files/' + record.collectionId() + '/' + record.getId() + '/' + imgField
      } else {
        image = 'https://img.usecurling.com/p/1200/630?q=exam%20study&color=blue'
      }
      redirectUrl = siteUrl + '/simulados/' + id
      ogType = 'website'
    } else if (type === 'documentarios' || type === 'documentaries') {
      const record = $app.findRecordById('doc_projects', id)
      title = record.getString('title')
      description =
        record.getString('description') || 'Documentário em Segurança e Saúde no Trabalho.'
      const photos = record.get('presentation_photos')
      if (Array.isArray(photos) && photos.length > 0) {
        image =
          pbUrl + '/api/files/' + record.collectionId() + '/' + record.getId() + '/' + photos[0]
      } else {
        image = 'https://img.usecurling.com/p/1200/630?q=documentary%20film&color=gray'
      }
      redirectUrl = siteUrl + '/documentarios/' + id
      ogType = 'website'
    } else if (type === 'mentorias' || type === 'mentorships') {
      const record = $app.findRecordById('mentorships', id)
      title = record.getString('title')
      description = record.getString('description') || 'Mentoria em Segurança e Saúde no Trabalho.'
      const imgField = record.getString('mentor_photo')
      if (imgField) {
        image =
          pbUrl + '/api/files/' + record.collectionId() + '/' + record.getId() + '/' + imgField
      } else {
        image = 'https://img.usecurling.com/p/1200/630?q=mentoring%20professional&color=orange'
      }
      redirectUrl = siteUrl + '/mentorias'
      ogType = 'website'
    } else if (type === 'convite') {
      const record = $app.findFirstRecordByData('workshop_invitations', 'token', id)
      const eventRec = $app.findRecordById('events', record.getString('event'))
      title = 'Convite para ' + record.getString('guest_name') + ' - Workshop SST'
      description =
        'Voce foi convidado para o ' +
        eventRec.getString('title') +
        '. Confira a programacao e confirme sua presenca!'
      image = 'https://img.usecurling.com/p/1200/630?q=corporate%20workshop&color=blue'
      redirectUrl = siteUrl + '/convite/' + id
      ogType = 'website'
    } else {
      return e.redirect(302, siteUrl)
    }
  } catch (err) {
    return e.redirect(302, siteUrl)
  }

  if (title.length > 60) title = title.substring(0, 57) + '...'
  if (description.length > 155) description = description.substring(0, 152) + '...'

  const escapeHtml = (unsafe) => {
    return (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  const safeTitle = escapeHtml(title)
  const safeDesc = escapeHtml(description)
  const safeImage = escapeHtml(image)
  const safeUrl = escapeHtml(redirectUrl)

  const ua = (e.request.header.get('User-Agent') || '').toLowerCase()
  const isBot =
    ua.includes('whatsapp') ||
    ua.includes('facebook') ||
    ua.includes('facebookexternalhit') ||
    ua.includes('linkedinbot') ||
    ua.includes('twitterbot') ||
    ua.includes('telegrambot') ||
    ua.includes('googlebot') ||
    ua.includes('google') ||
    ua.includes('bot') ||
    ua.includes('crawler') ||
    ua.includes('spider') ||
    ua.includes('slurp') ||
    ua.includes('duckduckbot') ||
    ua.includes('bingbot') ||
    ua.includes('baiduspider') ||
    ua.includes('yandexbot') ||
    ua.includes('ia_archiver')

  if (!isBot && redirectUrl) {
    return e.redirect(302, redirectUrl)
  }

  e.response.header().set('Cache-Control', 'no-cache, no-store, must-revalidate')
  e.response.header().set('Pragma', 'no-cache')
  e.response.header().set('Expires', '0')

  const html =
    '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <title>' +
    safeTitle +
    '</title>\n  <meta name="description" content="' +
    safeDesc +
    '">\n  <meta property="og:title" content="' +
    safeTitle +
    '">\n  <meta property="og:description" content="' +
    safeDesc +
    '">\n  <meta property="og:image" content="' +
    safeImage +
    '">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:url" content="' +
    safeUrl +
    '">\n  <meta property="og:type" content="' +
    ogType +
    '">\n  <meta property="og:site_name" content="Educacao SST">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="' +
    safeTitle +
    '">\n  <meta name="twitter:description" content="' +
    safeDesc +
    '">\n  <meta name="twitter:image" content="' +
    safeImage +
    '">\n  <meta http-equiv="refresh" content="0;url=' +
    safeUrl +
    '">\n  <script>window.location.replace("' +
    safeUrl +
    '");</script>\n</head>\n<body>\n  <p>Redirecionando para <a href="' +
    safeUrl +
    '">' +
    safeTitle +
    '</a>...</p>\n</body>\n</html>'

  return e.html(200, html)
})
