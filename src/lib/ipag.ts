/**
 * Tokenização de cartão — sempre no backend (Skip Cloud pb_hooks).
 *
 * O frontend NÃO carrega o script ipag.js e NÃO usa setIpagId / createToken
 * no navegador. Os dados do cartão são enviados por HTTPS para
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

/** Mensagem genérica quando o iPag não devolve razão aproveitável. */
export const GENERIC_CARD_ERROR =
  'Não foi possível validar o cartão. Verifique os dados e tente novamente.'

/**
 * Extrai a razão legível de um erro do PocketBase/Goja preservando o status
 * HTTP. O PocketBase (hook Goja) devolve { code, message }; o SDK pode lançar
 * ClientResponseError com a resposta em `response`. Em nenhuma hipótese a
 * mensagem sai com número completo de cartão ou CVV — o hook já sanitiza, e
 * aqui só repassamos texto.
 */
export function describeTokenizeError(err: unknown): { status: number; message: string } {
  const e = err as Record<string, unknown> | null
  // ClientResponseError do SDK PocketBase: `response` é o corpo { code, message };
  // hooks pb_hooks podem também devolver { data: { code, message } }.
  const response = (e?.response ?? {}) as Record<string, unknown>
  const inner = (response.data ?? (e as Record<string, unknown>)?.data ?? {}) as Record<
    string,
    unknown
  >
  const status = Number(response.code ?? response.status ?? e?.status ?? inner.code ?? 0)
  const msg = String(
    response.message ?? inner.message ?? (e as Record<string, unknown>)?.message ?? '',
  ).trim()
  return { status, message: msg || GENERIC_CARD_ERROR }
}

/**
 * Tokeniza o cartão no backend (POST /backend/v1/ipag/tokenize-card).
 * Lança Error com mensagem em pt-BR pronta para exibir ao usuário
 * (a razão real devolvida pelo iPag quando ele recusa).
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

  if (!cleanHolder) {
    throw new Error('Preencha o nome do titular do cartão.')
  }
  if (!cleanNumber || !cleanMonth || !cleanYear || !cleanCvv) {
    throw new Error('Preencha todos os dados do cartão.')
  }
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    throw new Error('Número de cartão inválido.')
  }
  const monthNum = parseInt(cleanMonth, 10)
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    throw new Error('Mês de validade inválido.')
  }
  const yearNum = parseInt(cleanYear, 10)
  if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
    throw new Error('Ano de validade inválido.')
  }
  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth() + 1
  if (yearNum < nowYear || (yearNum === nowYear && monthNum < nowMonth)) {
    throw new Error('Cartão vencido: verifique a validade.')
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
      throw new Error(GENERIC_CARD_ERROR)
    }

    return {
      token: data.token,
      brand: data.brand || '',
      last4: data.last4 || '',
    }
  } catch (err: any) {
    const { status, message } = describeTokenizeError(err)

    if (status === 422) {
      // Razão real devolvida pelo iPag (já sanitizada no hook)
      throw new Error(message || GENERIC_CARD_ERROR)
    }
    if (status === 400) {
      throw new Error(message || 'Dados do cartão incompletos ou inválidos.')
    }
    if (status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }
    if (status === 502) {
      throw new Error('Erro do servidor ao validar o cartão. Tente novamente.')
    }
    // Rede/timeout/qualquer outro status: erro do servidor
    throw new Error(
      message && message !== GENERIC_CARD_ERROR
        ? message
        : 'Erro do servidor ao processar o cartão. Tente novamente em instantes.',
    )
  }
}
