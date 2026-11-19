const DEFAULT_MAX_MB = 10
const DEFAULT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
}

export interface ValidateFileOptions {
  /** Limite máximo do arquivo em megabytes (padrão: 10). */
  maxSizeMB?: number
  /** Tipos MIME aceitos (padrão: image/jpeg, image/png, image/webp). */
  mimeTypes?: string[]
  /** Rótulo legível do arquivo para as mensagens (ex.: 'foto do professor'). */
  label?: string
}

/**
 * Valida tamanho e tipo de um arquivo. Retorna uma mensagem de erro em
 * português quando inválido, ou null quando o arquivo é aceito.
 */
export function validateFile(file: File, options: ValidateFileOptions = {}): string | null {
  const maxSizeMB = options.maxSizeMB ?? DEFAULT_MAX_MB
  const mimeTypes = options.mimeTypes ?? DEFAULT_MIME_TYPES
  const label = options.label?.trim() ?? ''

  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    return `Arquivo${label ? ` (${label})` : ''} muito grande. O tamanho máximo é ${maxSizeMB}MB.`
  }

  const type = (file.type || '').toLowerCase()
  if (type && !mimeTypes.includes(type)) {
    const exts = mimeTypes
      .map((m) => MIME_TO_EXT[m] ?? m.replace('image/', '').toUpperCase())
      .join(', ')
    return `Formato inválido${label ? ` (${label})` : ''}. Formatos aceitos: ${exts}.`
  }

  return null
}
