/**
 * Utilitários para sanitização, formatação e validação de CPF (Cadastro de Pessoas Físicas).
 *
 * Rejeita automaticamente números com tamanho incorreto, sequências com todos
 * os dígitos iguais (ex.: 000.000.000-00, 111.111.111-11) e calcula os dois
 * dígitos verificadores oficiais pelo algoritmo do módulo 11.
 */

/**
 * Remove qualquer caractere não numérico, retornando apenas os dígitos (máximo 11).
 */
export function sanitizeCpf(raw: string | null | undefined): string {
  if (!raw) return ''
  return String(raw).replace(/\D/g, '').slice(0, 11)
}

/**
 * Formata uma string de dígitos no padrão oficial de CPF: 000.000.000-00.
 * Aceita entradas parciais enquanto o usuário digita.
 */
export function formatCpf(raw: string | null | undefined): string {
  const digits = sanitizeCpf(raw)
  if (!digits) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

export interface CpfValidationResult {
  valid: boolean
  sanitized: string
  error?: string
}

/**
 * Valida o CPF segundo o algoritmo oficial da Receita Federal (módulo 11).
 *
 * Retorna um objeto detalhando se é válido, o CPF sanitizado (11 dígitos)
 * e mensagem clara em caso de erro.
 */
export function validateCpf(raw: string | null | undefined): CpfValidationResult {
  const sanitized = sanitizeCpf(raw)

  if (!sanitized) {
    return {
      valid: false,
      sanitized: '',
      error: 'CPF é obrigatório.',
    }
  }

  if (sanitized.length < 11) {
    return {
      valid: false,
      sanitized,
      error: `CPF incompleto (${sanitized.length} de 11 dígitos). Digite o CPF completo.`,
    }
  }

  if (sanitized.length > 11) {
    return {
      valid: false,
      sanitized: sanitized.slice(0, 11),
      error: 'CPF inválido. O CPF deve conter exatamente 11 dígitos.',
    }
  }

  // Rejeita sequências repetidas conhecidas (00000000000, 11111111111, ..., 99999999999)
  const isAllSameDigit = /^(\d)\1{10}$/.test(sanitized)
  if (isAllSameDigit) {
    return {
      valid: false,
      sanitized,
      error: 'CPF inválido. Verifique os números e tente novamente.',
    }
  }

  // Cálculo do 1º dígito verificador
  let sum1 = 0
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(sanitized.charAt(i), 10) * (10 - i)
  }
  let remainder1 = sum1 % 11
  const digit1 = remainder1 < 2 ? 0 : 11 - remainder1

  if (digit1 !== parseInt(sanitized.charAt(9), 10)) {
    return {
      valid: false,
      sanitized,
      error: 'CPF inválido. Verifique os números e tente novamente.',
    }
  }

  // Cálculo do 2º dígito verificador
  let sum2 = 0
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(sanitized.charAt(i), 10) * (11 - i)
  }
  let remainder2 = sum2 % 11
  const digit2 = remainder2 < 2 ? 0 : 11 - remainder2

  if (digit2 !== parseInt(sanitized.charAt(10), 10)) {
    return {
      valid: false,
      sanitized,
      error: 'CPF inválido. Verifique os números e tente novamente.',
    }
  }

  return {
    valid: true,
    sanitized,
  }
}
