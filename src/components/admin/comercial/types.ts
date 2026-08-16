import type { ClienteComercial, EtapaHistorico, OportunidadeComercial } from '@/types'

export interface OportunidadeComHistorico extends OportunidadeComercial {
  diasParado: number
}

export interface ClienteComOportunidades extends ClienteComercial {
  oportunidades?: OportunidadeComercial[]
}

export type EtapaHistoricoComExpand = EtapaHistorico

export const MOEDA = (valor?: number | null) =>
  typeof valor === 'number' && !Number.isNaN(valor)
    ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—'
