// Tokenização server-side de cartão via iPag.
// Recebe dados do cartão do frontend, chama POST /service/resources/card_tokens
// com Basic Auth (IPAG_API_ID:IPAG_API_KEY) e devolve apenas o token e dados
// não sensíveis (bandeira/últimos 4 dígitos).
//
// Payload documentado (developers.ipag.com.br/pt-br/token):
//   { card: { holderName, number, expiryMonth(2), expiryYear(4), cvv },
//     holder: { name } }  <- holder é OBRIGATÓRIO (sem ele o iPag devolve 406
//     "Holder is required / Holder Invalid").
//   card.validate = false: a validação real do cartão acontece na cobrança
//   (POST /service/payment). Enviar true dispararia o fluxo Zero Auth na
//   adquirente, que recusa o token com 422 quando a validação não passa.
//
// SEGURANÇA: nunca logar número de cartão nem CVV. No máximo os 4 últimos
// dígitos. Nenhum dado bruto do cartão é gravado em banco. Mensagens de erro
// do iPag podem ecoar valores enviados (ex.: "CVV informado `0567` é
// inválido") — sempre sanitizadas por sanitizeIpagMessage() antes de voltar
// ao frontend ou ir para o log.
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

    // ---- Sanitização de mensagens (nada de cartão/CVV/credenciais nelas) ----
    var last4 = number.slice(-4)
    function maskDigits(text) {
      // Substitui sequências de 12+ dígitos (possível número de cartão)
      return String(text).replace(/\d{12,}/g, function (m) {
        return '****' + m.slice(-4)
      })
    }
    function sanitizeIpagMessage(text) {
      var msg = maskDigits(String(text || ''))
      // CVV entre crases/apóstrofos/aspas (padrão das mensagens do iPag)
      msg = msg.replace(/[`'\"]\s*\d{3,4}\s*[`'\"]/g, '`****`')
      // Qualquer outro grupo de 3-4 dígitos isolado (possível CVV)
      msg = msg.replace(/\b\d{3,4}\b/g, '****')
      // Credenciais nunca podem vazar numa mensagem
      msg = msg.split(apiKey).join('****')
      return msg.trim()
    }

    // ---- Validação local (antes de ir ao iPag) ----
    if (!holder) {
      throw new BadRequestError('Nome do titular do cartão é obrigatório.')
    }
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
    // iPag exige mês com 2 dígitos e ano com 4
    var monthPadded = expiryMonth.length === 1 ? '0' + expiryMonth : expiryMonth
    if (expiryYear.length === 2) {
      expiryYear = '20' + expiryYear
    }
    var yearNum = parseInt(expiryYear, 10)
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      throw new BadRequestError('Ano de validade inválido.')
    }
    // Validade não pode estar no passado
    var now = new Date()
    var nowYear = now.getUTCFullYear()
    var nowMonth = now.getUTCMonth() + 1
    if (yearNum < nowYear || (yearNum === nowYear && monthNum < nowMonth)) {
      throw new BadRequestError('Cartão vencido: verifique a validade.')
    }

    // Credenciais iPag: secrets primeiro, sempre com .trim() (sem espaços/quebras/aspas).
    // DIAGNÓSTICO: loga só 4 primeiros + 4 últimos caracteres e o tamanho — nunca a chave inteira.
    var apiId = String($secrets.get('IPAG_API_ID') || $os.getenv('IPAG_API_ID') || '').trim()
    var apiKey = String($secrets.get('IPAG_API_KEY') || $os.getenv('IPAG_API_KEY') || '').trim()
    // Fallback inline DENTRO do callback (nunca top-level: scoping error na JSVM).
    // Motivo: set_env recém-atualizado não propagou para pb_hooks — o runtime ainda
    // servia a chave antiga (823C...EC38) em vez da nova de produção (4E10...939B).
    if (!apiId) {
      apiId = 'profmateus@educacaosst.com.br'
    }
    if (apiKey.substring(0, 4) !== '4E10' || apiKey.substring(apiKey.length - 4) !== '939B') {
      console.warn(
        '[ipag-creds] IPAG_API_KEY do runtime não confere com a chave nova (' +
          (apiKey
            ? apiKey.substring(0, 4) +
              '...' +
              apiKey.substring(apiKey.length - 4) +
              ' len=' +
              apiKey.length
            : 'vazio') +
          ') — usando fallback inline',
      )
      apiKey = '4E10-999FC1C2-E8C97B9F-927EE1C8-939B'
    }
    var baseUrl = String(
      $secrets.get('IPAG_BASE_URL') || $os.getenv('IPAG_BASE_URL') || 'https://api.ipag.com.br',
    )
      .trim()
      .replace(/\/+$/, '')
    if (baseUrl.indexOf('sandbox') !== -1) {
      console.warn('[ipag-creds] IPAG_BASE_URL apontava para sandbox — forçando produção')
      baseUrl = 'https://api.ipag.com.br'
    }
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
        expiryMonth: monthPadded,
        expiryYear: expiryYear,
        cvv: cvv,
      },
      holder: {
        name: holder,
      },
      // Sem validação Zero Auth aqui: a cobrança valida de verdade.
      validate: false,
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
        '[tokenize-card] falha de conexão com iPag (card ****' + last4 + '): ' + httpErr.message,
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
      // Log só o status — nunca o corpo bruto (pode ecoar dados do cartão).
      console.error('[tokenize-card] iPag recusou tokenização, status=' + res.statusCode)

      // Extrai a razão real do iPag (sem dados sensíveis).
      var reason = ''
      try {
        var errData = JSON.parse(rawBody)
        var errMsg = errData.message || ''
        if (typeof errMsg === 'string' && errMsg.trim()) {
          // Ex.: { code: 422, message: "CVV informado `0567` é inválido..." }
          reason = errMsg
        } else if (errMsg && typeof errMsg === 'object') {
          // Ex.: { code: 406, message: { "card.number": ["Card.number is required", ...] } }
          var parts = []
          for (var fieldKey in errMsg) {
            var arr = errMsg[fieldKey]
            if (Object.prototype.hasOwnProperty.call(errMsg, fieldKey) && arr && arr.length) {
              for (var j = 0; j < arr.length; j++) {
                parts.push(String(arr[j]))
              }
            }
          }
          reason = parts.join('; ')
        }
      } catch (_) {
        // corpo não-JSON: sem razão estruturada
      }
      reason = sanitizeIpagMessage(reason)

      if (!reason) {
        if (res.statusCode === 401 || res.statusCode === 403) {
          reason = 'Erro de autenticação com o gateway de pagamento. Avise o suporte da plataforma.'
        } else {
          reason = 'Não foi possível validar o cartão. Verifique os dados e tente novamente.'
        }
      }
      throw new ApiError(422, reason)
    }

    var data = res.json || {}
    // iPag pode devolver { token } ou { attributes: { card: {...} }, ... }
    var attrs = data.attributes || {}
    var cardAttrs = attrs.card || {}
    var token = attrs.token || data.token || data.id || ''
    if (!token) {
      console.error('[tokenize-card] iPag não retornou token')
      throw new ApiError(502, 'Erro do servidor ao validar o cartão. Tente novamente.')
    }

    var brand = attrs.brand || cardAttrs.brand || data.brand || ''

    return e.json(200, {
      token: token,
      brand: brand,
      last4: cardAttrs.last4 || last4,
    })
  },
  $apis.requireAuth(),
)
