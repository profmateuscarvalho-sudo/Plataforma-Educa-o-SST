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
