import type { Magazine } from '@/types'

/**
 * Helper para formatação de títulos de edições da Revista Educação SST.
 *
 * Regra: Quando o título da edição da Revista for apenas do formato "Revista nº X"
 * (começa com "Revista nº", com ou sem espaço/abreviação/maiusculas, e não tem mais conteúdo
 * além do número), exibir apenas "Edição nº X" — sem repetir o número duas vezes.
 *
 * Exemplos:
 * - "Revista nº 32" -> "Edição nº 32"
 * - "Revista nº32" -> "Edição nº 32"
 * - "Revista Nº 30" -> "Edição nº 30"
 * - "Revista n. 5" -> "Edição nº 5"
 * - "Revista nº 32 — Gestão de PGR" -> "Revista nº 32 — Gestão de PGR" (mantém completo)
 * - "Edição Especial de Natal" -> "Edição Especial de Natal" (mantém)
 */
export function formatMagazineTitle(rawTitle?: string | null): string {
  if (!rawTitle) return ''
  const trimmed = rawTitle.trim()
  if (!trimmed) return ''

  // Verifica se o título consiste EXCLUSIVAMENTE em "Revista nº X" (com variações de n/nº/n°/n./num/número e espaços)
  const regexOnlyIssue = /^revista\s*(?:n[ºo°.]|n\b|num\.?|número)\s*(\d+)$/i
  const match = trimmed.match(regexOnlyIssue)

  if (match) {
    const issueNumber = match[1]
    return `Edição nº ${issueNumber}`
  }

  return trimmed
}

/**
 * Extrai o número da edição a partir do título (ex: "Revista nº 32" -> "32").
 * Retorna o fallback fornecido caso não encontre um número.
 */
export function extractMagazineIssueNumber(rawTitle?: string | null, fallback = '32'): string {
  if (!rawTitle) return fallback
  const match = rawTitle.match(/n[ºo°.]?\s*(\d+)/i)
  return match ? match[1] : fallback
}

/**
 * Mês e ano da edição por extenso, com inicial maiúscula (ex.: "Outubro 2026").
 * Usa o mesmo campo de data (created) do destaque da página /revistas.
 */
export function formatMagazineMonthYear(mag: Magazine & { created?: string }): string {
  if (!mag.created) return ''
  const d = new Date(mag.created)
  if (isNaN(d.getTime())) return ''
  const tz = { timeZone: 'America/Sao_Paulo' }
  const mes = d.toLocaleDateString('pt-BR', { month: 'long', ...tz })
  const ano = d.toLocaleDateString('pt-BR', { year: 'numeric', ...tz })
  if (!mes) return ''
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${ano}`
}

/** Edição mais recente: a marcada como destaque, ou a primeira da lista (já ordenada). */
export function pickLatestMagazine(list: Magazine[]): Magazine | null {
  if (list.length === 0) return null
  return list.find((m) => m.is_featured) || list[0]
}

/** Título do card: "Edição do Mês" na mais recente; nas demais, mês e ano por extenso. */
export function getMagazineCardTitle(mag: Magazine, isLatest: boolean): string {
  if (isLatest) return 'Edição do Mês'
  return formatMagazineMonthYear(mag) || mag.title
}

/**
 * Linha pequena acima do título: "Edição nº 34" nas demais;
 * "Edição nº 35 · Novembro 2026" na mais recente.
 */
export function getMagazineCardKicker(mag: Magazine, isLatest: boolean): string {
  const issue = extractMagazineIssueNumber(mag.title, '')
  const monthYear = formatMagazineMonthYear(mag)
  const parts: string[] = []
  if (issue) parts.push(`Edição nº ${issue}`)
  if (isLatest && monthYear) parts.push(monthYear)
  return parts.join(' · ')
}
