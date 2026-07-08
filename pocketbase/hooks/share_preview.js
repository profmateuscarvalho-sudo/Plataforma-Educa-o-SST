routerAdd('GET', '/backend/v1/share/{type}/{id}', (e) => {
  const type = e.request.pathValue('type')
  const id = e.request.pathValue('id')
  const siteUrl = $secrets.get('SITE_URL') || 'https://educacaosst.goskip.app'

  let record
  let title = ''
  let description = ''
  let image = ''
  let redirectUrl = siteUrl
  let ogType = 'website'

  try {
    if (type === 'noticias') {
      record = $app.findRecordById('news', id)
      title = record.getString('title')
      const content = record.getString('content') || ''
      description = content
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
        .substring(0, 160)
      if (content.length > 160) description += '...'

      const imgField = record.getString('image')
      if (imgField) {
        image = `${siteUrl}/api/files/${record.collectionId()}/${record.getId()}/${imgField}`
      } else {
        image = 'https://img.usecurling.com/p/1200/600?q=industry&color=gray'
      }
      redirectUrl = `${siteUrl}/noticias/${id}`
      ogType = 'article'
    } else if (type === 'simulados') {
      record = $app.findRecordById('simulados', id)
      title = record.getString('title')
      const content = record.getString('description') || ''
      description = content
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
        .substring(0, 160)

      const imgField = record.getString('banner')
      if (imgField) {
        image = `${siteUrl}/api/files/${record.collectionId()}/${record.getId()}/${imgField}`
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
