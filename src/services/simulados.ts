import pb from '@/lib/pocketbase/client'
import type { Simulado, SimuladoQuestion } from '@/types'

export const getSimulados = async (activeOnly = false) => {
  const filter = activeOnly ? 'active = true' : ''
  return pb.collection('simulados').getFullList<Simulado>({ filter, sort: '-created' })
}

export const getSimulado = async (id: string) => pb.collection('simulados').getOne<Simulado>(id)

export const getSimuladoQuestions = async (simuladoId: string) =>
  pb.collection('simulado_questions').getFullList<SimuladoQuestion>({
    filter: `simulado = "${simuladoId}"`,
    sort: 'created',
  })

export const createSimulado = async (data: FormData) =>
  pb.collection('simulados').create<Simulado>(data)

export const updateSimulado = async (id: string, data: FormData) =>
  pb.collection('simulados').update<Simulado>(id, data)

export const deleteSimulado = async (id: string) => pb.collection('simulados').delete(id)

export const createSimuladoQuestion = async (data: Partial<SimuladoQuestion>) =>
  pb.collection('simulado_questions').create<SimuladoQuestion>(data)

export const updateSimuladoQuestion = async (id: string, data: Partial<SimuladoQuestion>) =>
  pb.collection('simulado_questions').update<SimuladoQuestion>(id, data)

export const deleteSimuladoQuestion = async (id: string) =>
  pb.collection('simulado_questions').delete(id)

export const submitSimuladoCompletion = async (simuladoId: string, userId: string) => {
  try {
    await pb.collection('simulado_submissions').create({
      simulado: simuladoId,
      user: userId,
    })
  } catch (error) {
    console.error('Erro ao registrar conclusão do simulado', error)
  }
}
