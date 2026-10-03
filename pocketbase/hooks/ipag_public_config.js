// Endpoint público para fornecer o identificador público do iPag (IPAG_API_ID)
// Seguro por design: expõe apenas o ID público da conta (necessário para o script cliente iPag.js)
// NUNCA expõe IPAG_API_KEY nem dados sensíveis.
routerAdd(
  'GET',
  '/backend/v1/ipag/public-config',
  (e) => {
    var apiId = $secrets.get('IPAG_API_ID') || $os.getenv('IPAG_API_ID') || ''
    var baseUrl = (
      $secrets.get('IPAG_BASE_URL') ||
      $os.getenv('IPAG_BASE_URL') ||
      'https://api.ipag.com.br'
    ).toLowerCase()
    var isSandbox = baseUrl.indexOf('sandbox') !== -1

    return e.json(200, {
      ipag_id: apiId,
      is_sandbox: isSandbox,
    })
  },
  /* público - sem requireAuth */
)
