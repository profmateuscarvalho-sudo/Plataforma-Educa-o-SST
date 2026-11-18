// Tokenização server-side de cartão via iPag.
// Recebe dados do cartão do frontend, chama POST /service/resources/card_tokens
// com Basic Auth (IPAG_API_ID:IPAG_API_KEY) e devolve apenas o token e dados
// não sensíveis (bandeira/últimos 4 dígitos).
//
// SEGURANÇA: nunca logar número de cartão nem CVV. No máximo os 4 últimos
// dígitos. Nenhum dado bruto do cartão é gravado em banco.
routerAdd(
  'POST',
  '/backend/v1/ipag/tokenize-card',
  (e) => {
    var body = e.requestInfo().body || {}

    var holder = String(body.holder || '').trim()
    var number = String(body.number || '').replace(/\D/g, '')
    var expiryMonth = String(body.expiryMonth || '').trim()
    var expiryYear = String(body.expiryYear || '').trim()
    var cvv = String(body.cvv || '').trim()

    if (!number || !expiryMonth || !expiryYear || !cvv) {
      throw new BadRequestError('Dados do cartão incompletos.')
    }
    if (number.length < 13 || number.length > 19) {
      throw new BadRequestError('Número de cartão inválido.')
    }
    if (cvv.length < 3 || cvv.length > 4) {
      throw new BadRequestError('CVV inválido.')
    }
    var monthNum = parseInt(expiryMonth, 10)
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new BadRequestError('Mês de validade inválido.')
    }
    if (expiryYear.length === 2) {
      expiryYear = '20' + expiryYear
    }
    var yearNum = parseInt(expiryYear, 10)
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      throw new BadRequestError('Ano de validade inválido.')
    }

    // Credenciais server-side — com fallback inline (set_env recém-criado pode
    // não propagar imediatamente para pb_hooks). NUNCA logar apiId/apiKey.
    var apiId =
      $secrets.get('IPAG_API_ID') ||
      $os.getenv('IPAG_API_ID') ||
      (function () {
        // preenchido inline para não depender da propagação de secrets
        return 'profmateus@educacaosst.com.br'
      })()
    var apiKey = $secrets.get('IPAG_API_KEY') || $os.getenv('IPAG_API_KEY') || ''
    if (!apiId || !apiKey) {
      console.error('[tokenize-card] credenciais iPag ausentes (IPAG_API_ID/IPAG_API_KEY)')
      throw new ApiError(500, 'Erro do servidor ao processar o cartão.')
    }

    var baseUrl = (
      $secrets.get('IPAG_BASE_URL') ||
      $os.getenv('IPAG_BASE_URL') ||
      'https://api.ipag.com.br'
    ).replace(/\/+$/, '')

    var authString = apiId + ':' + apiKey
    var authBase64
    try {
      authBase64 = btoa(authString)
    } catch (_) {
      var bytes = []
      for (var i = 0; i < authString.length; i++) {
        bytes.push(authString.charCodeAt(i))
      }
      authBase64 = String.fromCharCode.apply(null, bytes)
    }

    var cardPayload = {
      card: {
        holderName: holder,
        number: number,
        expiryMonth: expiryMonth,
        expiryYear: expiryYear,
        cvv: cvv,
      },
    }

    var res
    try {
      res = $http.send({
        url: baseUrl + '/service/resources/card_tokens',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Basic ' + authBase64,
          'x-api-version': '2',
        },
        body: JSON.stringify(cardPayload),
        timeout: 30,
      })
    } catch (httpErr) {
      console.error(
        '[tokenize-card] falha de conexão com iPag (card ****' +
          number.slice(-4) +
          '): ' +
          httpErr.message,
      )
      throw new ApiError(502, 'Erro do servidor ao validar o cartão. Tente novamente.')
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      var rawBody = ''
      if (res.raw) {
        rawBody = String(res.raw)
      } else if (res.body) {
        try {
          rawBody = String.fromCharCode.apply(null, new Uint8Array(res.body))
        } catch (_) {
          rawBody = String(res.body)
        }
      }
      // Nunca logar o corpo bruto (pode ecoar dados do cartão); log só o status.
      console.error('[tokenize-card] iPag recusou tokenização, status=' + res.statusCode)
      throw new ApiError(
        422,
        'Não foi possível validar o cartão. Verifique os dados e tente novamente.',
      )
    }

    var data = res.json || {}
    // iPag pode devolver { token } ou { attributes: { token, ... } }
    var attrs = data.attributes || data
    var token = attrs.token || attrs.id || data.token || data.id || ''
    if (!token) {
      console.error('[tokenize-card] iPag não retornou token')
      throw new ApiError(502, 'Erro do servidor ao validar o cartão. Tente novamente.')
    }

    var brand = attrs.brand || attrs.method || ''
    var last4 = number.slice(-4)

    return e.json(200, {
      token: token,
      brand: brand,
      last4: last4,
    })
  },
  $apis.requireAuth(),
)
