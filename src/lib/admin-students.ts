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
const PAGE_SIZE = 50

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
  // Paginado no servidor: percorre páginas de 50 (users role != admin) em vez
  // de baixar a base inteira de uma vez. O cache de 2 min já amortiza o custo.
  const items: AdminStudentItem[] = []
  let page = 1
  for (;;) {
    const res = await getStudents(page, PAGE_SIZE)
    for (const u of res.items) {
      items.push({ id: u.id, name: u.name || '', email: u.email || '' })
    }
    if (page >= Math.max(1, res.totalPages)) break
    page++
  }
  cached = items
  cachedAt = Date.now()
  return items
}
