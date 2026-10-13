/**
 * Utilitários de data respeitando o fuso America/Sao_Paulo (UTC-3)
 * sem deslocamento incorreto de fuso ou exibição de 1 dia a menos.
 */

const SP_TIMEZONE = 'America/Sao_Paulo'

/**
 * Obtém os componentes de data civil (ano, mês, dia) no fuso America/Sao_Paulo
 */
export function getSaoPauloDateParts(date: Date = new Date()): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SP_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
  const parts = formatter.formatToParts(date)
  let year = date.getUTCFullYear()
  let month = date.getUTCMonth() + 1
  let day = date.getUTCDate()

  for (const part of parts) {
    if (part.type === 'year') year = parseInt(part.value, 10)
    if (part.type === 'month') month = parseInt(part.value, 10)
    if (part.type === 'day') day = parseInt(part.value, 10)
  }

  return { year, month, day }
}

/**
 * Obtém a data de hoje no formato YYYY-MM-DD no fuso de São Paulo
 */
export function getTodaySaoPaulo(): string {
  const { year, month, day } = getSaoPauloDateParts()
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Faz parse de uma string de data (YYYY-MM-DD ou ISO) extraindo
 * a data civil sem conversão que mostre um dia a menos.
 */
export function parseDateParts(dateStr: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!dateStr) return null

  // Se vier no formato YYYY-MM-DD ou YYYY-MM-DDTHH...
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10),
    }
  }

  // Fallback para datas com outro formato
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return null
  return getSaoPauloDateParts(parsed)
}

/**
 * Formata uma data para exibição (DD/MM/YYYY) no fuso America/Sao_Paulo.
 * Se a string já estiver no padrão YYYY-MM-DD, divide por partes civis
 * evitando o bug de subtrair 1 dia pelo timezone local.
 */
export function formatLocalDate(dateStr: string | null | undefined, fallback: string = '-'): string {
  if (!dateStr) return fallback

  const parts = parseDateParts(dateStr)
  if (!parts) return fallback

  return `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}/${parts.year}`
}

/**
 * Formata um timestamp de cadastro (ex: created no PocketBase "2025-02-17 14:32:00.000Z")
 * no fuso de São Paulo.
 */
export function formatCreationDate(dateStr: string | null | undefined, fallback: string = '-'): string {
  if (!dateStr) return fallback
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return fallback
  return d.toLocaleDateString('pt-BR', { timeZone: SP_TIMEZONE })
}

/**
 * Verifica se a data de validade (contract_end_date) ainda está ativa (>= hoje em São Paulo).
 * Compara por partes civis (YYYY-MM-DD) para evitar erros de horário.
 */
export function isContractActive(contractEndDate: string | null | undefined): boolean {
  if (!contractEndDate) return false
  const target = parseDateParts(contractEndDate)
  if (!target) return false

  const today = getSaoPauloDateParts()

  if (target.year > today.year) return true
  if (target.year < today.year) return false

  if (target.month > today.month) return true
  if (target.month < today.month) return false

  return target.day >= today.day
}
