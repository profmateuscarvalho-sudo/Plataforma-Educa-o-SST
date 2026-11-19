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
 * Valida um arquivo selecionado (tamanho e tipo MIME).
 * Retorna uma mensagem de erro em string, ou null quando o arquivo é válido.
 * Consumidores: InstructorManager, MentorManager, admin/Documentaries/Wizard.
 */
export function validateFile(file: File, options: ValidateFileOptions = {}): string | null {
  const { maxSizeMB = 10, mimeTypes, label = 'arquivo' } = options

  if (maxSizeMB > 0 && file.size > maxSizeMB * 1024 * 1024) {
    return `O ${label} excede o tamanho máximo de ${maxSizeMB}MB.`
  }

  if (mimeTypes && mimeTypes.length > 0 && !mimeTypes.includes(file.type)) {
    return `Tipo de ${label} não permitido. Formatos aceitos: ${mimeTypes.join(', ')}.`
  }

  return null
}
