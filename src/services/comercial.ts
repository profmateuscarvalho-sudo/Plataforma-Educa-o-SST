import pb from '@/lib/pocketbase/client'
import type {
  ClienteComercial,
  EtapaHistorico,
  EtapaOportunidade,
  OportunidadeComercial,
} from '@/types'

export const ETAPAS: EtapaOportunidade[] = [
  'Cadastro',
  'Prospecção',
  'Aguardando retorno',
  'Retorno recebido',
  'Em decisão',
  'Concluído',
]

const OPORTUNIDADES_EXPAND = 'cliente_id,responsavel'

export async function getOportunidades(): Promise<OportunidadeComercial[]> {
  return await pb.collection('oportunidades').getFullList<OportunidadeComercial>({
    sort: '-created',
    expand: OPORTUNIDADES_EXPAND,
  })
}

export async function getOportunidade(id: string): Promise<OportunidadeComercial> {
  return await pb.collection('oportunidades').getOne<OportunidadeComercial>(id, {
    expand: OPORTUNIDADES_EXPAND,
  })
}

export async function updateOportunidadeEtapa(id: string, etapa: EtapaOportunidade) {
  return await pb.collection('oportunidades').update<OportunidadeComercial>(id, { etapa })
}

export async function updateOportunidade(id: string, data: Partial<OportunidadeComercial>) {
  return await pb.collection('oportunidades').update<OportunidadeComercial>(id, data)
}

export async function createOportunidade(
  data: Partial<OportunidadeComercial>,
): Promise<OportunidadeComercial> {
  return await pb.collection('oportunidades').create<OportunidadeComercial>({
    etapa: 'Cadastro',
    ...data,
  })
}

export async function getHistoricoEtapa(oportunidadeId: string): Promise<EtapaHistorico[]> {
  return await pb.collection('etapa_historico').getFullList<EtapaHistorico>({
    filter: `oportunidade_id = "${oportunidadeId}"`,
    sort: 'created',
  })
}

export async function getClientes(): Promise<ClienteComercial[]> {
  return await pb.collection('clientes').getFullList<ClienteComercial>({ sort: '-created' })
}

export async function getCliente(id: string): Promise<ClienteComercial> {
  return await pb.collection('clientes').getOne<ClienteComercial>(id)
}

export async function createCliente(data: Partial<ClienteComercial>): Promise<ClienteComercial> {
  return await pb.collection('clientes').create<ClienteComercial>(data)
}

export async function updateCliente(id: string, data: Partial<ClienteComercial>) {
  return await pb.collection('clientes').update<ClienteComercial>(id, data)
}

export async function getOportunidadesByCliente(
  clienteId: string,
): Promise<OportunidadeComercial[]> {
  return await pb.collection('oportunidades').getFullList<OportunidadeComercial>({
    filter: `cliente_id = "${clienteId}"`,
    sort: '-created',
    expand: OPORTUNIDADES_EXPAND,
  })
}

export function diasParadoNaEtapa(createdIso: string): number {
  const created = new Date(createdIso).getTime()
  if (Number.isNaN(created)) return 0
  const diffMs = Date.now() - created
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}
