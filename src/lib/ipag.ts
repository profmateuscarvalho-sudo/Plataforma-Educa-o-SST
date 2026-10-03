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

import pb from '@/lib/pocketbase/client'

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
 * Configured at build time via VITE_IPAG_API_ID or VITE_IPAG_ID,
 * with runtime fallback to GET /backend/v1/ipag/public-config (IPAG_API_ID secret).
 */
export const IPAG_API_ID: string =
  (import.meta.env.VITE_IPAG_API_ID as string) || (import.meta.env.VITE_IPAG_ID as string) || ''

/**
 * Differentiates sandbox vs production.
 * Considers:
 * - VITE_IPAG_BASE_URL or VITE_IPAG_URL (if containing 'sandbox' -> sandbox, if containing 'api.ipag' -> prod)
 * - VITE_IPAG_ENV ('production' / 'prod' vs 'sandbox' / 'dev')
 * - VITE_IPAG_SANDBOX or VITE_IPAG_IS_SANDBOX ('true'/'1' vs 'false'/'0')
 * - Default: in production build (import.meta.env.PROD === true), use production (api.ipag.com.br);
 *   in development, sandbox.
 */
export const IS_IPAG_SANDBOX: boolean = (() => {
  const baseUrl = (
    (import.meta.env.VITE_IPAG_BASE_URL as string | undefined) ||
    (import.meta.env.VITE_IPAG_URL as string | undefined) ||
    ''
  ).toLowerCase()
  if (baseUrl.includes('sandbox')) return true
  if (baseUrl.includes('api.ipag.com.br')) return false

  const explicitEnv = (import.meta.env.VITE_IPAG_ENV as string | undefined)?.toLowerCase()
  if (explicitEnv === 'production' || explicitEnv === 'prod') return false
  if (explicitEnv === 'sandbox' || explicitEnv === 'dev' || explicitEnv === 'development')
    return true

  const sandboxFlag = (
    (import.meta.env.VITE_IPAG_SANDBOX as string | undefined) ||
    (import.meta.env.VITE_IPAG_IS_SANDBOX as string | undefined)
  )?.toLowerCase()
  if (sandboxFlag === 'true' || sandboxFlag === '1') return true
  if (sandboxFlag === 'false' || sandboxFlag === '0') return false

  return !import.meta.env.PROD
})()

export const IPAG_SCRIPT_URL: string = IS_IPAG_SANDBOX
  ? 'https://sandbox.ipag.com.br/js/dist/ipag.js'
  : 'https://api.ipag.com.br/js/dist/ipag.js'

let runtimePublicId: string | null = null
let fetchConfigPromise: Promise<string> | null = null

/**
 * Fetches the public iPag ID from the backend public endpoint if not set at build time.
 * Caches the result in-memory so network request is made only once.
 */
export async function resolveIpagPublicId(): Promise<string> {
  if (IPAG_API_ID && IPAG_API_ID.trim()) {
    return IPAG_API_ID.trim()
  }

  if (runtimePublicId) {
    return runtimePublicId
  }

  if (fetchConfigPromise) {
    return fetchConfigPromise
  }

  fetchConfigPromise = (async () => {
    try {
      const data = await pb.send<{ ipag_id?: string; is_sandbox?: boolean }>(
        '/backend/v1/ipag/public-config',
        { method: 'GET' },
      )
      const fetchedId = (data?.ipag_id || '').trim()
      if (fetchedId) {
        runtimePublicId = fetchedId
        return fetchedId
      }
    } catch (err: any) {
      console.warn('[iPag] Falha ao obter identificador público em runtime:', err?.message || err)
    }
    return ''
  })()

  const id = await fetchConfigPromise
  fetchConfigPromise = null
  return id
}

let scriptLoadingPromise: Promise<void> | null = null

/**
 * Ensures the iPag tokenizer script is loaded on the page and preheats public config.
 */
export function loadIpagScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  // Pre-fetch public ID in background while script loads
  if (!IPAG_API_ID) {
    resolveIpagPublicId().catch(() => {})
  }

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
  const [, apiId] = await Promise.all([loadIpagScript(), resolveIpagPublicId()])

  if (!window.iPag) {
    throw new Error('A biblioteca iPag não foi carregada no navegador.')
  }

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
