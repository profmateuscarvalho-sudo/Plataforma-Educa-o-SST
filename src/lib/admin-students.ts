import { AccessEvent } from '@/services/access_events'
import { getStudents } from '@/services/users'
import { User } from '@/types'

export interface AdminStudentItem {
  id: string
  name: string
  email: string
}

let cached: AdminStudentItem[] | null = null
let cachedAt = 0
const TTL_MS = 120_000

/**
 * Lista alunos com e-mail, para exibição admin.
 *
 * O endpoint custom /backend/v1/admin/students não existe mais no backend —
 * tentar buscá-lo em um host estático produzia 404 "File not found". Aqui
 * usamos a coleção `users` diretamente (regra de lista liberada para admins),
 * que traz e-mail, nome e avatar na mesma resposta.
 */
export async function getAdminStudents(): Promise<AdminStudentItem[]> {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached
  const users = (await getStudents()) as unknown as User[]
  const items = users.map((u) => ({
    id: u.id,
    name: u.name || '',
    email: u.email || '',
  }))
  cached = items
  cachedAt = Date.now()
  return items
}
