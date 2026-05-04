routerAdd('GET', '/backend/v1/share/{type}/{id}', (e) => {
  const type = e.request.pathValue('type')
  const id = e.request.pathValue('id')
  const frontendUrl = 'https://educacaosst.goskip.app'
  const pbUrl =
    $secrets.get('PB_INSTANCE_URL') ||
    'https://educacao-sst-premium-969c2.shrd00.internal.goskip.dev'

  let record
  let title = ''
  let description = ''
  let image = ''
  let redirectUrl = frontendUrl
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
        image = `${pbUrl}/api/files/${record.collectionId()}/${record.getId()}/${imgField}`
      } else {
        image = 'https://img.usecurling.com/p/1200/600?q=industry&color=gray'
      }
      redirectUrl = `${frontendUrl}/noticias/${id}`
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
        image = `${pbUrl}/api/files/${record.collectionId()}/${record.getId()}/${imgField}`
      } else {
        image = 'https://img.usecurling.com/p/1200/600?q=education&color=blue'
      }
      redirectUrl = `${frontendUrl}/simulados/${id}`
      ogType = 'website'
    } else {
      return e.redirect(302, frontendUrl)
    }
  } catch (err) {
    return e.redirect(302, frontendUrl)
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
