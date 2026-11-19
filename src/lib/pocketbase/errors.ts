import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

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

export interface ValidateFileOptions {
  maxSizeMB?: number
  mimeTypes?: string[]
  label?: string
}

// Valida um arquivo de upload (tamanho e tipo) e devolve mensagem de erro ou null.
export function validateFile(file: File, options: ValidateFileOptions = {}): string | null {
  const { maxSizeMB = 10, mimeTypes, label = 'arquivo' } = options
  if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
    return `A ${label} excede o tamanho máximo de ${maxSizeMB} MB.`
  }
  if (mimeTypes && mimeTypes.length > 0 && !mimeTypes.includes(file.type)) {
    return `Formato de ${label} inválido. Formatos aceitos: ${mimeTypes
      .map((t) => t.replace('image/', '').toUpperCase())
      .join(', ')}.`
  }
  return null
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'An unexpected error occurred.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  return msgs.length > 0 ? msgs.join(' ') : error.message || 'An unexpected error occurred.'
}
