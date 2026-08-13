import pb from '@/lib/pocketbase/client'
import type { Simulado, SimuladoQuestion, SimuladoSubmission } from '@/types'

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

export const incrementSimuladoAccess = async (id: string) => {
  try {
    await pb.send(`/backend/v1/simulados/${id}/view`, { method: 'POST' })
  } catch (error) {
    console.error('Erro ao incrementar acessos do simulado', error)
  }
}

export const submitSimuladoCompletion = async (
  simuladoId: string,
  userId?: string,
  score?: number,
  total?: number,
) => {
  try {
    const percentage =
      typeof score === 'number' && typeof total === 'number' && total > 0
        ? Math.round((score / total) * 100)
        : 0
    const data: Record<string, unknown> = {
      simulado: simuladoId,
      score: score ?? 0,
      total_questions: total ?? 0,
      percentage,
      completed_at: new Date().toISOString(),
    }
    if (userId) {
      data.user = userId
    }
    await pb.collection('simulado_submissions').create<SimuladoSubmission>(data)
    return percentage
  } catch (error) {
    console.error('Erro ao registrar conclusão do simulado', error)
    return 0
  }
}

/** Returns all submissions for the given user (newest first). */
export const getUserSimuladoSubmissions = async (userId: string) => {
  return await pb.collection('simulado_submissions').getFullList<SimuladoSubmission>({
    filter: `user="${userId}"`,
    sort: '-created',
    expand: 'simulado',
  })
}
