import { describe, it, expect } from 'vitest'
import { sanitizeCpf, formatCpf, validateCpf } from './cpf'

describe('CPF utils', () => {
  describe('sanitizeCpf', () => {
    it('removes dots, dashes, spaces and non-numeric characters', () => {
      expect(sanitizeCpf('123.456.789-01')).toBe('12345678901')
      expect(sanitizeCpf(' 123-456.789/01 ')).toBe('12345678901')
      expect(sanitizeCpf('abc123def456ghi78901')).toBe('12345678901')
    })

    it('handles empty / null / undefined gracefully', () => {
      expect(sanitizeCpf('')).toBe('')
      expect(sanitizeCpf(null)).toBe('')
      expect(sanitizeCpf(undefined)).toBe('')
    })

    it('truncates to at most 11 digits', () => {
      expect(sanitizeCpf('123456789012345')).toBe('12345678901')
    })
  })

  describe('formatCpf', () => {
    it('formats partial inputs', () => {
      expect(formatCpf('123')).toBe('123')
      expect(formatCpf('1234')).toBe('123.4')
      expect(formatCpf('123456')).toBe('123.456')
      expect(formatCpf('1234567')).toBe('123.456.7')
      expect(formatCpf('123456789')).toBe('123.456.789')
      expect(formatCpf('1234567890')).toBe('123.456.789-0')
      expect(formatCpf('12345678901')).toBe('123.456.789-01')
    })
  })

  describe('validateCpf', () => {
    it('rejects empty input', () => {
      const res = validateCpf('')
      expect(res.valid).toBe(false)
      expect(res.error).toBe('CPF é obrigatório.')
    })

    it('rejects incomplete CPF with specific length feedback', () => {
      const res = validateCpf('123.456')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('incompleto')
      expect(res.error).toContain('6 de 11')
    })

    it('rejects known repeated sequences like 000.000.000-00, 111.111.111-11', () => {
      const sequences = [
        '000.000.000-00',
        '111.111.111-11',
        '222.222.222-22',
        '333.333.333-33',
        '444.444.444-44',
        '555.555.555-55',
        '666.666.666-66',
        '777.777.777-77',
        '888.888.888-88',
        '999.999.999-99',
      ]
      for (const seq of sequences) {
        const res = validateCpf(seq)
        expect(res.valid).toBe(false)
        expect(res.error).toBe('CPF inválido. Verifique os números e tente novamente.')
      }
    })

    it('rejects invalid verification digits (e.g. 123.456.789-00)', () => {
      const res = validateCpf('123.456.789-00')
      expect(res.valid).toBe(false)
      expect(res.error).toBe('CPF inválido. Verifique os números e tente novamente.')
    })

    it('accepts valid CPFs and sanitizes them', () => {
      // 79999338801 is iPag's documented test CPF
      const res1 = validateCpf('799.993.388-01')
      expect(res1.valid).toBe(true)
      expect(res1.sanitized).toBe('79999338801')
      expect(res1.error).toBeUndefined()

      // Also without formatting
      const res2 = validateCpf('79999338801')
      expect(res2.valid).toBe(true)
      expect(res2.sanitized).toBe('79999338801')
    })
  })
})
