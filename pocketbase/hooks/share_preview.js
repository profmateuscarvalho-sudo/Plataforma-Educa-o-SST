routerAdd('GET', '/backend/v1/share/{type}/{id}', (e) => {
  const type = e.request.pathValue('type')
  const id = e.request.pathValue('id')
  const siteUrl = $secrets.get('SITE_URL') || 'https://www.educacaosst.com.br'
  const pbUrl = $secrets.get('PB_INSTANCE_URL') || siteUrl

  let record
  let title = ''
  let description = ''
  let image = ''
  let redirectUrl = siteUrl
  let ogType = 'website'

  try {
    if (type === 'noticias' || type === 'news') {
      record = $app.findRecordById('news', id)
      title = record.getString('title')
      const content = record.getString('content') || ''
      let plainText = content
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
      description = plainText.substring(0, 160)
      if (plainText.length > 160) description += '...'

      const imgField = record.getString('image')
      if (imgField) {
        image = `${pbUrl}/api/files/${record.collectionId()}/${record.getId()}/${imgField}`
      } else {
        const galleryField = record.get('images')
        let firstImage = ''
        if (Array.isArray(galleryField) && galleryField.length > 0) {
          firstImage = galleryField[0]
        } else if (typeof galleryField === 'string' && galleryField.trim()) {
          try {
            const parsed = JSON.parse(galleryField)
            if (Array.isArray(parsed) && parsed.length > 0) firstImage = parsed[0]
          } catch (err) {
            firstImage = galleryField
          }
        }

        if (firstImage) {
          image = `${pbUrl}/api/files/${record.collectionId()}/${record.getId()}/${firstImage}`
        } else {
          image = 'https://img.usecurling.com/p/1200/600?q=industry&color=gray'
        }
      }
      redirectUrl = `${siteUrl}/noticias/${id}`
      ogType = 'article'
    } else if (type === 'simulados') {
      record = $app.findRecordById('simulados', id)
      title = record.getString('title')
      const content = record.getString('description') || ''
      let plainText = content
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
      description = plainText.substring(0, 160)
      if (plainText.length > 160) description += '...'

      const imgField = record.getString('banner')
      if (imgField) {
        image = `${pbUrl}/api/files/${record.collectionId()}/${record.getId()}/${imgField}`
      } else {
        image = 'https://img.usecurling.com/p/1200/600?q=education&color=blue'
      }
      redirectUrl = `${siteUrl}/simulados/${id}`
      ogType = 'website'
    } else if (type === 'convite') {
      record = $app.findFirstRecordByData('workshop_invitations', 'token', id)
      const eventRec = $app.findRecordById('events', record.getString('event'))
      title = `Convite para ${record.getString('guest_name')} - Workshop SST`
      description = `Você foi convidado para o ${eventRec.getString('title')}. Confira a programação e confirme sua presença!`
      image = 'https://img.usecurling.com/p/1200/600?q=corporate%20workshop&color=blue'
      redirectUrl = `${siteUrl}/convite/${id}`
      ogType = 'website'
    } else {
      return e.redirect(302, siteUrl)
    }
  } catch (err) {
    return e.redirect(302, siteUrl)
  }

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
    ua.includes('facebookexternalhit') ||
    ua.includes('linkedinbot') ||
    ua.includes('twitterbot') ||
    ua.includes('telegrambot') ||
    ua.includes('bot') ||
    ua.includes('crawler') ||
    ua.includes('spider')

  if (!isBot && redirectUrl) {
    return e.redirect(302, redirectUrl)
  }

  e.response.header().set('Cache-Control', 'no-cache, no-store, must-revalidate')
  e.response.header().set('Pragma', 'no-cache')
  e.response.header().set('Expires', '0')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="Educação SST">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImage}">

  <meta http-equiv="refresh" content="0;url=${safeUrl}">
  <script>window.location.replace("${safeUrl}");</script>
</head>
<body>
  <p>Redirecionando para <a href="${safeUrl}">${safeTitle}</a>...</p>
</body>
</html>`

  return e.html(200, html)
})
