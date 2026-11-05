import pb from '@/lib/pocketbase/client'

export interface LeadDiaTst {
  id: string
  nome: string
  cidade_uf: string
  email: string
  whatsapp: string
  instagram: string
  frase: string
  aceite_regulamento: boolean
  aceite_lgpd: boolean
  aceita_comunicacoes: boolean
  story_verificado: boolean
  nota: number
  origem: string
  created: string
}

export interface DiaTstConfig {
  id: string
  chave: string
  regulamento: string
}

export interface DiaTstPartner {
  id: string
  nome: string
  logo: string
  ordem: number
  active: boolean
  collectionId?: string
}

export interface InscricaoPayload {
  nome: string
  cidade_uf: string
  email: string
  whatsapp: string
  instagram: string
  frase: string
  aceite_regulamento: boolean
  aceite_lgpd: boolean
  aceita_comunicacoes: boolean
  origem?: string
}

/** Cria a inscrição. Erros do servidor (duplicidade, prazo, rate limit) propagam. */
export function criarInscricaoDiaTst(payload: InscricaoPayload) {
  return pb.collection('leads_dia_tst').create<LeadDiaTst>(payload)
}

/** Regulamento completo (texto editável no painel). Público, sem login. */
export async function getRegulamentoDiaTst(): Promise<string> {
  try {
    const rec = await pb
      .collection('dia_tst_config')
      .getFirstListItem<DiaTstConfig>('chave="regulamento"')
    return rec.regulamento || ''
  } catch {
    return ''
  }
}

export function updateRegulamentoDiaTst(id: string, regulamento: string) {
  return pb.collection('dia_tst_config').update<DiaTstConfig>(id, { regulamento })
}

export function getRegulamentoConfig(): Promise<DiaTstConfig | null> {
  return pb
    .collection('dia_tst_config')
    .getFirstListItem<DiaTstConfig>('chave="regulamento"')
    .catch(() => null)
}

/** Parceiros da faixa de logos (ativos, ordenados). */
export async function getParceirosDiaTst(): Promise<DiaTstPartner[]> {
  try {
    return await pb.collection('dia_tst_partners').getFullList<DiaTstPartner>({
      filter: 'active=true',
      sort: 'ordem,-created',
    })
  } catch {
    return []
  }
}

export const getLeadsDiaTst = () =>
  pb.collection('leads_dia_tst').getFullList<LeadDiaTst>({ sort: '-created' })

export function updateLeadDiaTst(
  id: string,
  data: Partial<Pick<LeadDiaTst, 'story_verificado' | 'nota'>>,
) {
  return pb.collection('leads_dia_tst').update<LeadDiaTst>(id, data)
}
