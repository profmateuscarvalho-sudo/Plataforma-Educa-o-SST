routerAdd('GET', '/backend/v1/og-preview', (e) => {
  const rawPath = e.requestInfo().query['path'] || ''
  const siteUrl = $secrets.get('SITE_URL') || 'https://www.educacaosst.com.br'
  const pbUrl = $secrets.get('PB_INSTANCE_URL') || siteUrl

  let title = 'Educacao SST'
  let description =
    'Plataforma premium de cursos e mentorias em Seguranca e Saude no Trabalho (SST).'
  let image = 'https://img.usecurling.com/p/1200/630?q=workplace%20safety&color=green'
  let redirectUrl = siteUrl
  let ogType = 'website'

  const pathPart = rawPath.split('?')[0].replace(/^\//, '')
  const parts = pathPart.split('/').filter(function (p) {
    return p !== ''
  })

  const pathQueryStr = rawPath.split('?')[1] || ''
  const queryParams = {}
  if (pathQueryStr) {
    pathQueryStr.split('&').forEach(function (pair) {
      const kv = pair.split('=')
      if (kv.length === 2) queryParams[kv[0]] = decodeURIComponent(kv[1])
    })
  }

  try {
    if (parts[0] === 'noticias' && parts[1]) {
      const record = $app.findRecordById('news', parts[1])
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
      redirectUrl = siteUrl + '/noticias/' + parts[1]
      ogType = 'article'
    } else if (parts[0] === 'cursos' && parts[1]) {
      const record = $app.findRecordById('courses', parts[1])
      title = record.getString('title')
      description = record.getString('description') || 'Curso de Seguranca e Saude no Trabalho.'
      const imgField = record.getString('thumbnail')
      if (imgField) {
        image =
          pbUrl + '/api/files/' + record.collectionId() + '/' + record.getId() + '/' + imgField
      } else {
        image = 'https://img.usecurling.com/p/1200/630?q=education%20course&color=green'
      }
      redirectUrl = siteUrl + '/cursos/' + parts[1]
      ogType = 'website'
    } else if (parts[0] === 'revistas') {
      const magId = queryParams['revista']
      if (magId) {
        const record = $app.findRecordById('magazines', magId)
        title = record.getString('title')
        description = record.getString('summary') || 'Edicao da Revista SST.'
        const imgField = record.getString('thumbnail')
        if (imgField) {
          image =
            pbUrl + '/api/files/' + record.collectionId() + '/' + record.getId() + '/' + imgField
        } else {
          image = 'https://img.usecurling.com/p/1200/630?q=magazine%20cover&color=blue'
        }
        redirectUrl = siteUrl + '/revistas?revista=' + magId
      } else {
        title = 'Acervo Cientifico | Educacao SST'
        description = 'Acesso gratuito as publicacoes periodicas em Seguranca e Saude no Trabalho.'
        redirectUrl = siteUrl + '/revistas'
      }
      ogType = 'website'
    } else if (parts[0] === 'agora') {
      if (parts[1]) {
        const record = $app.findRecordById('agora_debates', parts[1])
        title = '🏛️ Debate: ' + record.getString('tema')
        const content = record.getString('descricao') || ''
        let plainText = content
          .replace(/<[^>]*>?/gm, '')
          .replace(/&nbsp;/g, ' ')
          .trim()
        description = plainText.substring(0, 155)
        if (plainText.length > 155) description += '...'
        redirectUrl = siteUrl + '/plataforma/agora/' + parts[1]
      } else {
        title = 'Ágora de Debates | Educação SST'
        description = 'Participe dos debates técnicos da comunidade de SST.'
        redirectUrl = siteUrl + '/plataforma/agora'
      }
      image = 'https://img.usecurling.com/p/1200/630?q=greek%20forum%20debate&color=terracotta'
      ogType = 'website'
    } else if (parts[0] === 'simulados' && parts[1]) {
      const record = $app.findRecordById('simulados', parts[1])
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
      redirectUrl = siteUrl + '/simulados/' + parts[1]
      ogType = 'website'
    } else if (parts[0] === 'documentarios' && parts[1]) {
      const record = $app.findRecordById('doc_projects', parts[1])
      title = record.getString('title')
      description = record.getString('description') || 'Documentario em SST.'
      const photos = record.get('presentation_photos')
      if (Array.isArray(photos) && photos.length > 0) {
        image =
          pbUrl + '/api/files/' + record.collectionId() + '/' + record.getId() + '/' + photos[0]
      } else {
        image = 'https://img.usecurling.com/p/1200/630?q=documentary%20film&color=gray'
      }
      redirectUrl = siteUrl + '/documentarios/' + parts[1]
      ogType = 'website'
    } else if (parts[0] === 'mentorias') {
      title = 'Mentorias SST | Educacao SST'
      description = 'Mentorias especializadas em Seguranca e Saude no Trabalho.'
      redirectUrl = siteUrl + '/mentorias'
      ogType = 'website'
    }
  } catch (err) {
    // keep defaults
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
