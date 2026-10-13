import { getLocalStates, getLocalCitiesByState } from '@/data/brazil-locations'

export interface IBGEState {
  id: number
  sigla: string
  nome: string
}

export interface IBGECity {
  id: number
  nome: string
}

export async function getStates(): Promise<IBGEState[]> {
  // Retorna do arquivo estático local do projeto para não depender da API externa
  return Promise.resolve(getLocalStates())
}

export async function getCitiesByState(uf: string): Promise<IBGECity[]> {
  // Retorna do arquivo estático local do projeto para não depender da API externa
  return Promise.resolve(getLocalCitiesByState(uf))
}
