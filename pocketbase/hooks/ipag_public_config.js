// Endpoint público para fornecer o identificador público do iPag (IPAG_PUBLIC_ID)
// usado pelo script cliente iPag.js (setIpagId). Deve ter 36 caracteres.
// O IPAG_API_ID (login) e a IPAG_API_KEY continuam usados APENAS no backend,
// para a autenticação servidor-a-servidor — nunca são expostos aqui.
routerAdd('POST', '/backend/v1/ipag/public-config', (e) => {
  // ID público iPag (36 caracteres) — é público por design: é exatamente o que
  // este endpoint expõe ao frontend para o iPag.js (setIpagId). A variável de
  // ambiente IPAG_PUBLIC_ID, quando definida, tem precedência sobre o fallback.
  var publicId =
    $secrets.get('IPAG_PUBLIC_ID') ||
    $os.getenv('IPAG_PUBLIC_ID') ||
    '52FE-46EB973B-093285B8-D0D4FE52-D555'
  if (publicId.length !== 36) {
    console.warn(
      '[ipag_public_config] IPAG_PUBLIC_ID com tamanho inesperado: ' +
        publicId.length +
        ' caracteres (esperado: 36)',
    )
  }
  var baseUrl = (
    $secrets.get('IPAG_BASE_URL') ||
    $os.getenv('IPAG_BASE_URL') ||
    'https://api.ipag.com.br'
  ).toLowerCase()
  var isSandbox = baseUrl.indexOf('sandbox') !== -1

  return e.json(200, {
    ipag_id: publicId,
    is_sandbox: isSandbox,
  })
})

routerAdd('GET', '/backend/v1/ipag/public-config', (e) => {
  // ID público iPag (36 caracteres) — é público por design: é exatamente o que
  // este endpoint expõe ao frontend para o iPag.js (setIpagId). A variável de
  // ambiente IPAG_PUBLIC_ID, quando definida, tem precedência sobre o fallback.
  var publicId =
    $secrets.get('IPAG_PUBLIC_ID') ||
    $os.getenv('IPAG_PUBLIC_ID') ||
    '52FE-46EB973B-093285B8-D0D4FE52-D555'
  if (publicId.length !== 36) {
    console.warn(
      '[ipag_public_config] IPAG_PUBLIC_ID com tamanho inesperado: ' +
        publicId.length +
        ' caracteres (esperado: 36)',
    )
  }
  var baseUrl = (
    $secrets.get('IPAG_BASE_URL') ||
    $os.getenv('IPAG_BASE_URL') ||
    'https://api.ipag.com.br'
  ).toLowerCase()
  var isSandbox = baseUrl.indexOf('sandbox') !== -1

  return e.json(200, {
    ipag_id: publicId,
    is_sandbox: isSandbox,
  })
})
