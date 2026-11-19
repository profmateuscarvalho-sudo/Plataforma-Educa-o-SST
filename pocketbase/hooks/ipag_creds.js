// Credenciais iPag: resolução única a partir dos secrets/env do runtime, com
// .trim() e sem fallback literal no código. Loga só 4 primeiros + 4 últimos
// caracteres e o tamanho — nunca a chave inteira.
function resolveIpagCredentials() {
  var apiId = String($secrets.get('IPAG_API_ID') || $os.getenv('IPAG_API_ID') || '').trim()
  var apiKey = String($secrets.get('IPAG_API_KEY') || $os.getenv('IPAG_API_KEY') || '').trim()
  var baseUrl = String(
    $secrets.get('IPAG_BASE_URL') || $os.getenv('IPAG_BASE_URL') || 'https://api.ipag.com.br',
  )
    .trim()
    .replace(/\/+$/, '')
  if (baseUrl.indexOf('sandbox') !== -1) {
    console.warn('[ipag-creds] IPAG_BASE_URL apontava para sandbox — forçando produção')
    baseUrl = 'https://api.ipag.com.br'
  }
  return { apiId: apiId, apiKey: apiKey, baseUrl: baseUrl }
}

function logIpagCreds(apiId, apiKey, baseUrl) {
  console.log(
    '[ipag-creds] baseUrl=' +
      baseUrl +
      ' apiId=' +
      apiId +
      ' apiKey=' +
      apiKey.substring(0, 4) +
      '...' +
      apiKey.substring(apiKey.length - 4) +
      ' (len=' +
      apiKey.length +
      ')',
  )
}
