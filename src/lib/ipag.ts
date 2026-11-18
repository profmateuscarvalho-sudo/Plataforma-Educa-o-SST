/**
 * Tokenização de cartão — agora SEMPRE no backend (Skip Cloud pb_hooks).
 *
 * O frontend NÃO carrega mais o script ipag.js e NÃO usa mais setIpagId /
 * createToken no navegador. Os dados do cartão são enviados por HTTPS para
 * POST /backend/v1/ipag/tokenize-card, que chama o endpoint do iPag
 * POST /service/resources/card_tokens com Basic Auth server-side
 * (IPAG_API_ID:IPAG_API_KEY) e devolve apenas o token + dados não sensíveis
 * (bandeira / últimos 4 dígitos).
 *
 * Nenhum número de cartão ou CVV é gravado em banco nem logado.
 */

import pb from '@/lib/pocketbase/client'

export interface TokenizeCardParams {
  holder: string
  number: string
  expiryMonth: string
  expiryYear: string
  cvv: string
}

export interface TokenizeCardResult {
  token: string
  brand?: string
  last4?: string
}

/**
 * Tokeniza o cartão no backend (POST /backend/v1/ipag/tokenize-card).
 * Lança Error com mensagem em pt-BR pronta para exibir ao usuário.
 */
export async function tokenizeCard(params: TokenizeCardParams): Promise<string> {
  const result = await tokenizeCardDetailed(params)
  return result.token
}

export async function tokenizeCardDetailed(
  params: TokenizeCardParams,
): Promise<TokenizeCardResult> {
  // Limpeza: remove tudo que não é dígito do número; mês com 2 dígitos;
  // ano com 2 dígitos é expandido para 4.
  const cleanNumber = params.number.replace(/\D/g, '')
  const cleanMonth = params.expiryMonth.trim().padStart(2, '0')
  let cleanYear = params.expiryYear.trim()
  if (cleanYear.length === 2) {
    cleanYear = '20' + cleanYear
  }
  const cleanCvv = params.cvv.trim()
  const cleanHolder = params.holder.trim()

  if (!cleanNumber || !cleanMonth || !cleanYear || !cleanCvv) {
    throw new Error('Preencha todos os dados do cartão.')
  }

  try {
    const data = await pb.send<TokenizeCardResult>('/backend/v1/ipag/tokenize-card', {
      method: 'POST',
      body: JSON.stringify({
        holder: cleanHolder,
        number: cleanNumber,
        expiryMonth: cleanMonth,
        expiryYear: cleanYear,
        cvv: cleanCvv,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!data || !data.token) {
      throw new Error('Não foi possível validar o cartão. Verifique os dados e tente novamente.')
    }

    return {
      token: data.token,
      brand: data.brand || '',
      last4: data.last4 || '',
    }
  } catch (err: any) {
    // PocketBaseClientResponseError: origem = resposta HTTP do backend
    const status = err?.status || err?.response?.status
    const serverMessage = err?.message || err?.response?.message

    if (status === 422) {
      throw new Error(
        serverMessage || 'Não foi possível validar o cartão. Verifique os dados e tente novamente.',
      )
    }
    if (status === 400) {
      throw new Error(serverMessage || 'Dados do cartão incompletos ou inválidos.')
    }
    if (status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }
    if (status === 502) {
      throw new Error('Erro do servidor ao validar o cartão. Tente novamente.')
    }
    // Rede/timeout/qualquer outro status: erro do servidor
    throw new Error(
      serverMessage || 'Erro do servidor ao processar o cartão. Tente novamente em instantes.',
    )
  }
}
