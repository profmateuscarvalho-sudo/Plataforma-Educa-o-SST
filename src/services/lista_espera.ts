import pb from '@/lib/pocketbase/client'

export interface ListaEsperaPayload {
  nome: string
  email: string
  plano: string
  data?: string
}

export async function cadastrarListaEspera(payload: ListaEsperaPayload) {
  const data = payload.data || new Date().toISOString()
  return await pb.collection('lista_espera').create({
    nome: payload.nome.trim(),
    email: payload.email.trim().toLowerCase(),
    plano: payload.plano,
    data,
  })
}
