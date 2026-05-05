import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getLeads } from '@/services/leads'
import { Lead } from '@/types'
import { LeadList } from '@/components/admin/leads/LeadList'
import { SmtpSettingsForm } from '@/components/admin/leads/SmtpSettingsForm'
import { EmailCampaigns } from '@/components/admin/leads/EmailCampaigns'

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    getLeads().then(setLeads)
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Leads & Contatos</h2>
          <p className="text-slate-500 mt-1">Gerencie contatos e dispare campanhas de e-mail.</p>
        </div>
        <Button asChild>
          <Link to="/admin/leads/import">
            <Upload className="w-4 h-4 mr-2" />
            Importar CSV
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Lista de Leads</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas de E-mail</TabsTrigger>
          <TabsTrigger value="smtp">Configurações SMTP</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <LeadList leads={leads} />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-0">
          <EmailCampaigns />
        </TabsContent>

        <TabsContent value="smtp" className="mt-0">
          <SmtpSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
