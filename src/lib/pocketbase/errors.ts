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

/**
 * Valida um arquivo (foto/upload) informado em formulários admin.
 * Mensagens em pt-BR; devolve null quando o arquivo é aceito.
 */
export function validateFile(
  file: File | null | undefined,
  opts?: { maxSizeMB?: number; mimeTypes?: string[]; label?: string },
): string | null {
  if (!file || !file.size) return null
  const label = opts?.label || 'arquivo'
  const maxSizeMB = opts?.maxSizeMB ?? 10
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `A ${label} deve ter no máximo ${maxSizeMB} MB.`
  }
  const allowed = opts?.mimeTypes
  if (allowed && allowed.length > 0 && !allowed.includes(file.type)) {
    return `Formato inválido para a ${label}. Aceitos: ${allowed.join(', ')}.`
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
