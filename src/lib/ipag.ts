/**
 * iPag Client Tokenization Integration
 *
 * Official iPag tokenizer documentation:
 * Script:
 * - Sandbox: https://sandbox.ipag.com.br/js/dist/ipag.js
 * - Production: https://api.ipag.com.br/js/dist/ipag.js
 *
 * Methods:
 * - iPag.setIpagId('<IPAG_API_ID>')
 * - iPag.setTestMode() // optional for sandbox
 * - iPag.setCreditCard(holder, number, expiryMonth, expiryYear, cvv)
 * - iPag.createToken() -> Promise<{ token: string, ... }>
 */

declare global {
  interface Window {
    iPag?: {
      setIpagId: (id: string) => void
      setTestMode: () => void
      setDebit: () => void
      setCreditCard: (
        holder: string,
        number: string,
        expiryMonth: string,
        expiryYear: string,
        cvv: string,
      ) => any
      createToken: () => Promise<{
        token?: string
        error?: string
        message?: any
        [key: string]: any
      }>
      getBrandInfo: (number: string) => { type: string; blocks: any }
      validateCreditCardNumber: (number: string) => boolean
      validateExpiration: (month: string, year: string) => boolean
      validateCVV: (cvv: string, brand: string) => boolean
    }
  }
}

/**
 * Public iPag API ID used by the client tokenizer.
 * Can be configured via VITE_IPAG_API_ID or VITE_IPAG_ID.
 */
export const IPAG_API_ID: string =
  (import.meta.env.VITE_IPAG_API_ID as string) || (import.meta.env.VITE_IPAG_ID as string) || ''

/**
 * Differentiates sandbox vs production.
 * If VITE_IPAG_ENV is 'production' or import.meta.env.PROD is true without an explicit sandbox override,
 * or if VITE_IPAG_IS_SANDBOX === 'false'.
 */
export const IS_IPAG_SANDBOX: boolean = (() => {
  const explicitEnv = (import.meta.env.VITE_IPAG_ENV as string | undefined)?.toLowerCase()
  if (explicitEnv === 'production' || explicitEnv === 'prod') return false
  if (explicitEnv === 'sandbox' || explicitEnv === 'dev' || explicitEnv === 'development')
    return true

  const sandboxFlag = import.meta.env.VITE_IPAG_SANDBOX as string | undefined
  if (sandboxFlag === 'true' || sandboxFlag === '1') return true
  if (sandboxFlag === 'false' || sandboxFlag === '0') return false

  // By default in dev/test we use sandbox, or check Vite mode
  return !import.meta.env.PROD
})()

export const IPAG_SCRIPT_URL: string = IS_IPAG_SANDBOX
  ? 'https://sandbox.ipag.com.br/js/dist/ipag.js'
  : 'https://api.ipag.com.br/js/dist/ipag.js'

let scriptLoadingPromise: Promise<void> | null = null

/**
 * Ensures the iPag tokenizer script is loaded on the page.
 */
export function loadIpagScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  if (window.iPag) {
    return Promise.resolve()
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise
  }

  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    // Check if script tag already exists
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${IPAG_SCRIPT_URL}"]`)
    if (existing) {
      if (window.iPag) {
        resolve()
      } else {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () =>
          reject(new Error(`Falha ao carregar script do iPag: ${IPAG_SCRIPT_URL}`)),
        )
      }
      return
    }

    const script = document.createElement('script')
    script.src = IPAG_SCRIPT_URL
    script.async = true
    script.onload = () => {
      resolve()
    }
    script.onerror = () => {
      scriptLoadingPromise = null
      reject(
        new Error(`Falha ao carregar script do iPag (${IPAG_SCRIPT_URL}). Verifique sua conexão.`),
      )
    }
    document.head.appendChild(script)
  })

  return scriptLoadingPromise
}

export interface TokenizeCardParams {
  holder: string
  number: string
  expiryMonth: string
  expiryYear: string
  cvv: string
}

/**
 * Uses window.iPag to generate a secure single-use card token in the browser.
 */
export async function tokenizeCard(params: TokenizeCardParams): Promise<string> {
  await loadIpagScript()

  if (!window.iPag) {
    throw new Error('A biblioteca iPag não foi carregada no navegador.')
  }

  const apiId = IPAG_API_ID
  if (!apiId) {
    throw new Error(
      'Identificador público do iPag não configurado (VITE_IPAG_API_ID). Por favor, configure a variável de ambiente.',
    )
  }

  window.iPag.setIpagId(apiId)
  if (IS_IPAG_SANDBOX && typeof window.iPag.setTestMode === 'function') {
    window.iPag.setTestMode()
  }

  // Ensure card number has no spaces/dashes
  const cleanNumber = params.number.replace(/\D/g, '')
  // Month: 2 digits (e.g. "05")
  const cleanMonth = params.expiryMonth.trim().padStart(2, '0')
  // Year: 4 digits (e.g. "2030")
  let cleanYear = params.expiryYear.trim()
  if (cleanYear.length === 2) {
    cleanYear = '20' + cleanYear
  }
  const cleanCvv = params.cvv.trim()
  const cleanHolder = params.holder.trim()

  window.iPag.setCreditCard(cleanHolder, cleanNumber, cleanMonth, cleanYear, cleanCvv)

  const response = await window.iPag.createToken()

  if (!response) {
    throw new Error('Não foi possível obter o token do cartão junto ao iPag.')
  }

  if (response.token) {
    return response.token
  }

  // In case iPag returned an error payload
  const errMsg =
    (typeof response.message === 'string' ? response.message : null) ||
    response.error ||
    (typeof response.message === 'object' ? JSON.stringify(response.message) : null) ||
    'Falha ao tokenizar cartão. Verifique os dados digitados.'

  throw new Error(errMsg)
}
