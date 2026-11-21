import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Upload, Download, Loader2 } from 'lucide-react'
import { getLeads } from '@/services/leads'
import { Lead } from '@/types'
import { LeadList } from '@/components/admin/leads/LeadList'
import { exportLeadsToExcel } from '@/lib/export-leads'

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getLeads(page)
      .then((res) => {
        setLeads(res.items)
        setTotal(res.totalItems)
        setTotalPages(Math.max(1, Math.ceil(res.totalItems / 50)))
      })
      .catch(console.error)
  }, [page])

  // Export usa a página atual (50 registros) — exportar a base inteira de
  // leads não fazia sentido em uma tela paginada; use Importar CSV para carga.
  const handleExport = () => {
    setExporting(true)
    try {
      exportLeadsToExcel(leads)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Leads & Contatos</h2>
          <p className="text-slate-500 mt-1">Gerencie contatos e dispare campanhas de e-mail.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            disabled={exporting || leads.length === 0}
            variant="outline"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Exportar para Excel
          </Button>
          <Button asChild>
            <Link to="/admin/leads/import">
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Link>
          </Button>
        </div>
      </div>

      <LeadList leads={leads} />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-slate-500">
          Página {page} de {totalPages} — {total} leads
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
