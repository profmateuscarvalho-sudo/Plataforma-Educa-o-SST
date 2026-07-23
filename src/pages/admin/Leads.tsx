import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Upload, Download, Loader2 } from 'lucide-react'
import { getLeads } from '@/services/leads'
import { Lead } from '@/types'
import { LeadList } from '@/components/admin/leads/LeadList'
import { exportLeadsToCsv } from '@/lib/export-leads'

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getLeads().then(setLeads)
  }, [])

  const handleExport = () => {
    setExporting(true)
    try {
      exportLeadsToCsv(leads)
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
    </div>
  )
}
