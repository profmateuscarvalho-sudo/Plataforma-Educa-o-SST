import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getLeads } from '@/services/leads'
import { Lead } from '@/types'

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
          <p className="text-slate-500 mt-1">
            Gerencie contatos recebidos através das landing pages e formulários da plataforma.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/leads/import">
            <Upload className="w-4 h-4 mr-2" />
            Importar CSV
          </Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Mensagem/Interesse</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-slate-800">{l.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{l.email}</div>
                    <div className="text-xs text-slate-500">{l.phone}</div>
                  </TableCell>
                  <TableCell
                    className="max-w-xs truncate text-slate-600"
                    title={l.message || 'Interesse geral / Notificações'}
                  >
                    {l.message || 'Interesse geral / Notificações'}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(l.created).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Nenhum lead recebido ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
