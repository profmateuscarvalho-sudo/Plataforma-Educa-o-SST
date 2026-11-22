/**
 * Exportações CSV completas do admin — SEMPRE server-side.
 *
 * Cliente do hook pocketbase/hooks/admin_export.js:
 *   GET /backend/v1/admin/export/{leads|students|payments}?search=&status=&from=&to=
 *
 * O servidor pagina a base inteira em lotes de 500 e devolve o CSV pronto
 * (BOM UTF-8, separador ";"). O navegador nunca baixa listas para montar o
 * arquivo no cliente — aqui só recebemos o blob e disparamos o download.
 */
import pb from '@/lib/pocketbase/client'

export type AdminExportTipo = 'leads' | 'students' | 'payments'

export interface AdminExportFiltros {
  /** Busca ativa (nome, e-mail ou telefone) — mesmos critérios da tela. */
  search?: string
  /** Filtro de status dos pagamentos: paid | pending | failed. */
  status?: string
  /** Data inicial AAAA-MM-DD (relógio SP). */
  from?: string
  /** Data final AAAA-MM-DD (relógio SP). */
  to?: string
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null
  const m = /filename="?([^";]+)"?/i.exec(header)
  return m ? m[1] : null
}

export async function exportAdminCsv(tipo: AdminExportTipo, filtros: AdminExportFiltros = {}) {
  const params = new URLSearchParams()
  if (filtros.search) params.set('search', filtros.search)
  if (filtros.status) params.set('status', filtros.status)
  if (filtros.from) params.set('from', filtros.from)
  if (filtros.to) params.set('to', filtros.to)
  const qs = params.toString()

  const res = await pb.send<Response>(`/backend/v1/admin/export/${tipo}${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: { Accept: 'text/csv' },
  })

  if (!res.ok) {
    let msg = 'Erro ao gerar a exportação'
    try {
      const data = (await res.json()) as { error?: string }
      if (data?.error) msg = data.error
    } catch {
      /* resposta não-JSON: mantém mensagem genérica */
    }
    throw new Error(msg)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download =
    filenameFromDisposition(res.headers.get('Content-Disposition')) ||
    `${tipo}_export_${new Date().toISOString().slice(0, 10)}.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
