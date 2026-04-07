onRecordUpdate((e) => {
  try {
    const oldRecord = $app.findRecordById('magazines', e.record.id)

    let targetLink = e.record.get('fliphtml5_link')
    let oldTargetLink = oldRecord.get('fliphtml5_link')

    const embedCode = e.record.get('embed_code')
    const oldEmbedCode = oldRecord.get('embed_code')

    const thumbnail = e.record.get('thumbnail')
    const oldThumbnail = oldRecord.get('thumbnail')

    if (!targetLink && embedCode) {
      const srcMatch = embedCode.match(/src=["']([^"']+)["']/i)
      if (srcMatch && srcMatch[1]) {
        targetLink = srcMatch[1]
      }
    }

    if (!oldTargetLink && oldEmbedCode) {
      const srcMatch = oldEmbedCode.match(/src=["']([^"']+)["']/i)
      if (srcMatch && srcMatch[1]) {
        oldTargetLink = srcMatch[1]
      }
    }

    // Pula se não tiver link, ou se o link não mudou e já temos uma capa
    if (!targetLink || (targetLink === oldTargetLink && thumbnail)) {
      e.next()
      return
    }

    // Se uma nova capa foi enviada manualmente, não tenta extrair
    if (thumbnail && thumbnail !== oldThumbnail) {
      e.next()
      return
    }

    const res = $http.send({
      url: targetLink,
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15,
    })

    if (res.statusCode === 200) {
      let bytes = res.body
      let length = bytes.byteLength !== undefined ? bytes.byteLength : bytes.length
      let view = bytes.byteLength !== undefined ? new Uint8Array(bytes) : bytes
      let limit = length > 100000 ? 100000 : length
      let html = ''
      for (let i = 0; i < limit; i++) {
        html += String.fromCharCode(view[i])
      }

      const ogImageMatch =
        html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
      let imageUrl = ''

      if (ogImageMatch && ogImageMatch[1]) {
        imageUrl = ogImageMatch[1]
      } else {
        let base = targetLink.split('?')[0]
        if (!base.endsWith('/')) base += '/'
        imageUrl = base + 'files/shot.jpg'
      }

      if (imageUrl) {
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl

        const imgRes = $http.send({
          url: imageUrl,
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 15,
        })

        if (imgRes.statusCode === 200) {
          const file = new File([imgRes.body], 'cover.jpg', { type: 'image/jpeg' })
          e.record.set('thumbnail', file)
        }
      }
    }
  } catch (err) {
    console.log('Error extracting FlipHTML5 thumbnail on update:', err)
  }
  e.next()
}, 'magazines')
