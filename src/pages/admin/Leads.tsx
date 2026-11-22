import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Upload, Download, Loader2 } from 'lucide-react'
import { getLeads } from '@/services/leads'
import { Lead } from '@/types'
import { LeadList } from '@/components/admin/leads/LeadList'
import { exportAdminCsv } from '@/lib/admin-export'
import { useToast } from '@/hooks/use-toast'

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    getLeads(page)
      .then((res) => {
        setLeads(res.items)
        setTotal(res.totalItems)
        setTotalPages(Math.max(1, Math.ceil(res.totalItems / 50)))
      })
      .catch(console.error)
  }, [page])

  // Export CSV completo via rota server-side (hook admin_export.js): o servidor
  // pagina a base inteira aplicando os mesmos critérios da tela; o navegador
  // só recebe o arquivo pronto (não baixa lista nenhuma).
  const handleExport = async () => {
    setExporting(true)
    try {
      await exportAdminCsv('leads')
      toast({ title: 'Exportação concluída', description: 'CSV de leads baixado.' })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao exportar leads',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
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
          <Button onClick={handleExport} disabled={exporting} variant="outline">
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Exportar CSV
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
