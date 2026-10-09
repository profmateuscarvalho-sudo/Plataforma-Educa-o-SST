import { describe, it, expect } from 'vitest'
import { formatMagazineTitle, extractMagazineIssueNumber } from './magazine-utils'

describe('formatMagazineTitle', () => {
  it('converte "Revista nº 32" para "Edição nº 32"', () => {
    expect(formatMagazineTitle('Revista nº 32')).toBe('Edição nº 32')
  })

  it('converte "Revista nº32" (sem espaço) para "Edição nº 32"', () => {
    expect(formatMagazineTitle('Revista nº32')).toBe('Edição nº 32')
  })

  it('converte "Revista Nº 30" (maiúscula) para "Edição nº 30"', () => {
    expect(formatMagazineTitle('Revista Nº 30')).toBe('Edição nº 30')
  })

  it('converte "Revista n° 15" e "Revista n. 8" para "Edição nº X"', () => {
    expect(formatMagazineTitle('Revista n° 15')).toBe('Edição nº 15')
    expect(formatMagazineTitle('Revista n. 8')).toBe('Edição nº 8')
    expect(formatMagazineTitle('Revista num 99')).toBe('Edição nº 99')
  })

  it('mantém títulos com conteúdo além do número', () => {
    expect(formatMagazineTitle('Revista nº 32 — Gestão de PGR')).toBe(
      'Revista nº 32 — Gestão de PGR',
    )
    expect(formatMagazineTitle('Revista Nº 31 Especial de Segurança')).toBe(
      'Revista Nº 31 Especial de Segurança',
    )
    expect(formatMagazineTitle('Edição de Setembro')).toBe('Edição de Setembro')
    expect(formatMagazineTitle('Revista Educação SST')).toBe('Revista Educação SST')
  })

  it('trata valores vazios ou nulos graciosamente', () => {
    expect(formatMagazineTitle('')).toBe('')
    expect(formatMagazineTitle(null)).toBe('')
    expect(formatMagazineTitle(undefined)).toBe('')
    expect(formatMagazineTitle('   ')).toBe('')
  })
})

describe('extractMagazineIssueNumber', () => {
  it('extrai números corretamente', () => {
    expect(extractMagazineIssueNumber('Revista nº 32')).toBe('32')
    expect(extractMagazineIssueNumber('Revista nº32')).toBe('32')
    expect(extractMagazineIssueNumber('Edição nº 40')).toBe('40')
    expect(extractMagazineIssueNumber('Sem número', '10')).toBe('10')
  })
})
