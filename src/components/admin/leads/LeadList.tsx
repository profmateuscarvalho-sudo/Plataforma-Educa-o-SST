import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Lead } from '@/types'

export function LeadList({ leads }: { leads: Lead[] }) {
  return (
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
  )
}
