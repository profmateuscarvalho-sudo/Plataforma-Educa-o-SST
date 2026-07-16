export interface IBGEState {
  id: number
  sigla: string
  nome: string
}

export interface IBGECity {
  id: number
  nome: string
}

const BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades'

export async function getStates(): Promise<IBGEState[]> {
  const res = await fetch(`${BASE_URL}/estados?orderBy=nome`)
  if (!res.ok) throw new Error('Failed to fetch states')
  return res.json()
}

export async function getCitiesByState(uf: string): Promise<IBGECity[]> {
  const res = await fetch(`${BASE_URL}/estados/${uf}/municipios?orderBy=nome`)
  if (!res.ok) throw new Error('Failed to fetch cities')
  return res.json()
}
