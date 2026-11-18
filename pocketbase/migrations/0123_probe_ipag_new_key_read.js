// Validação de leitura da NOVA API_KEY de produção do iPag.
// Faz UMA chamada GET autenticada com Basic Auth (IPAG_API_ID:IPAG_API_KEY,
// lidos via $secrets.get/$os.getenv — nunca com valor inline) a um endpoint
// somente de leitura da API do iPag (/service/resources/customers).
// NÃO cria cobrança, assinatura nem token de cartão.
// Resultado vai para os logs (stream hooks): [IPAG_KEY_CHECK].
//
// PADRÃO DO PROJETO (migrações 0114-0119): console.log em migração não chega
// ao stream "hooks" no ar, então o resultado é também gravado em
// access_events (area=IPAG_KEY_CHECK_RESULT, meta.status).
migrate(
  (app) => {
    const apiId = $secrets.get('IPAG_API_ID') || $os.getenv('IPAG_API_ID') || ''
    const apiKey = $secrets.get('IPAG_API_KEY') || $os.getenv('IPAG_API_KEY') || ''
    const baseUrl = (
      $secrets.get('IPAG_BASE_URL') ||
      $os.getenv('IPAG_BASE_URL') ||
      'https://api.ipag.com.br'
    ).replace(/\/+$/, '')

    if (!apiId || !apiKey) {
      console.log('[IPAG_KEY_CHECK] SKIP: credenciais ausentes (IPAG_API_ID/IPAG_API_KEY)')
      return
    }
    console.log('[IPAG_KEY_CHECK] id_len=' + apiId.length + ' key_len=' + apiKey.length)

    const authString = apiId + ':' + apiKey
    let authBase64
    try {
      authBase64 = btoa(authString)
    } catch (_) {
      const bytes = []
      for (let i = 0; i < authString.length; i++) {
        bytes.push(authString.charCodeAt(i))
      }
      authBase64 = String.fromCharCode.apply(null, bytes)
    }

    let probeStatus = -1
    try {
      const res = $http.send({
        url: baseUrl + '/service/resources/customers?per_page=1',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Basic ' + authBase64,
          'x-api-version': '2',
        },
        timeout: 15,
      })
      probeStatus = res.statusCode
    } catch (err) {
      probeStatus = -2
      console.log('[IPAG_KEY_CHECK] ERRO de conexão: ' + err.message)
    }
    // NUNCA logar o corpo (pode conter dados de clientes); só o status.
    console.log('[IPAG_KEY_CHECK] GET customers status=' + probeStatus)

    try {
      const eventsCol = $app.findCollectionByNameOrId('access_events')
      const diagUser = $app.findFirstRecordByFilter('users', "email = 'mateus@educacaosst.com.br'")
      const logRec = new Record(eventsCol)
      logRec.set('user', diagUser.id)
      logRec.set('area', 'IPAG_KEY_CHECK_RESULT')
      logRec.set('event_type', 'page_view')
      logRec.set('meta', { status: probeStatus, key_len: apiKey.length })
      $app.save(logRec)
    } catch (logErr) {
      console.log('[IPAG_KEY_CHECK] falha ao gravar access_events: ' + logErr.message)
    }
  },
  (app) => {},
)
