import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

const MAX_FILE_MB = 10
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Valida tamanho e tipo de um arquivo escolhido num input. Retorna mensagem de erro ou undefined. */
export function validateFile(
  file: File,
  opts: { maxSizeMB?: number; mimeTypes?: string[]; label?: string } = {},
): string | undefined {
  const label = opts.label ? `da ${opts.label}` : 'do arquivo'
  const maxMB = opts.maxSizeMB ?? MAX_FILE_MB
  const allowed = opts.mimeTypes ?? IMAGE_MIME_TYPES
  if (file.size > maxMB * 1024 * 1024) {
    return `O arquivo excede o limite de ${maxMB}MB.`
  }
  if (allowed.length > 0 && !allowed.includes(file.type)) {
    return `Formato inválido. Formatos aceitos: ${allowed.map((t) => t.replace('image/', '.').toUpperCase()).join(', ')}.`
  }
  return undefined
}

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      errors[field] = (detail as { message: string }).message
    }
  }
  return errors
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'An unexpected error occurred.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  return msgs.length > 0 ? msgs.join(' ') : error.message || 'An unexpected error occurred.'
}
