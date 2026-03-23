import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { getLeads } from '@/services/leads'
import { Lead } from '@/types'

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    getLeads().then(setLeads)
  }, [])

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-serif font-bold text-secondary">Leads (Falar com Consultor)</h2>
      <Card>
        <CardContent className="p-0 divide-y">
          {leads.map((l) => (
            <div key={l.id} className="p-4 hover:bg-slate-50 flex justify-between items-start">
              <div>
                <p className="font-bold text-secondary">{l.name}</p>
                <p className="text-sm text-slate-600">
                  {l.email} • {l.phone}
                </p>
                {l.message && (
                  <p className="text-sm text-slate-500 mt-2 bg-slate-100 p-2 rounded">
                    {l.message}
                  </p>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {new Date(l.created).toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
          {leads.length === 0 && (
            <p className="p-8 text-center text-slate-500">Nenhum lead recebido ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
