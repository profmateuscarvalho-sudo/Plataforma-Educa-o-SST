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
  /** Tamanho máximo em MB (ex.: 10). */
  maxSizeMB: number
  /** Mime types aceitos (ex.: ['image/jpeg', 'image/png', 'image/webp']). */
  mimeTypes: string[]
  /** Rótulo do arquivo nas mensagens de erro (ex.: 'foto do professor'). */
  label?: string
}

/**
 * Valida um arquivo (tamanho e tipo). Retorna uma mensagem de erro em pt-BR
 * quando inválido, ou null quando o arquivo está OK.
 */
export function validateFile(file: File, options: ValidateFileOptions): string | null {
  const label = options.label || 'arquivo'
  if (!file || !file.size) {
    return null // campo vazio — quem exige obrigatoriedade é o formulário
  }
  const maxBytes = options.maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    return `O ${label} excede o tamanho máximo de ${options.maxSizeMB} MB (tamanho atual: ${(
      file.size /
      (1024 * 1024)
    ).toFixed(1)} MB).`
  }
  const accepted = options.mimeTypes
  const extOk = file.name
    ? accepted.some((mt) => {
        const exts =
          mt === 'image/jpeg'
            ? ['.jpg', '.jpeg']
            : mt === 'image/png'
              ? ['.png']
              : mt === 'image/webp'
                ? ['.webp']
                : []
        return exts.some((ext) => file.name.toLowerCase().endsWith(ext))
      })
    : false
  if (!accepted.includes(file.type) && !extOk) {
    return `Formato de ${label} inválido. Aceitos: ${accepted
      .map((mt) =>
        mt === 'image/jpeg'
          ? 'JPG'
          : mt === 'image/png'
            ? 'PNG'
            : mt === 'image/webp'
              ? 'WebP'
              : mt,
      )
      .join(', ')}.`
  }
  return null
}
