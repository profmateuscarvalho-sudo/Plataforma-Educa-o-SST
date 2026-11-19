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

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'An unexpected error occurred.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  return msgs.length > 0 ? msgs.join(' ') : error.message || 'An unexpected error occurred.'
}

export interface ValidateFileOptions {
  maxSizeMB?: number
  mimeTypes?: string[]
  label?: string
}

/**
 * Valida um arquivo escolhido num formulário (tamanho e tipo).
 * Retorna uma mensagem de erro em português ou null quando válido.
 */
export function validateFile(file: File | null, options: ValidateFileOptions = {}): string | null {
  if (!file) return null
  const { maxSizeMB = 10, mimeTypes, label = 'arquivo' } = options

  if (mimeTypes && mimeTypes.length > 0 && !mimeTypes.includes(file.type)) {
    return `Tipo de arquivo não permitido para ${label}. Formatos aceitos: ${mimeTypes
      .map((t) => t.replace('image/', '').toUpperCase())
      .join(', ')}.`
  }

  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    return `O arquivo de ${label} excede o limite de ${maxSizeMB}MB (tamanho: ${(
      file.size /
      (1024 * 1024)
    ).toFixed(1)}MB).`
  }

  return null
}
