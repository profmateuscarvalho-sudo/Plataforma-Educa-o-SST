import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getConnections, generateSubmissionLink } from '@/services/magazine_management'
import { ProfessionalConnection } from '@/types'
import { Eye, Link as LinkIcon, Printer } from 'lucide-react'

export default function AdminMagazineConnections() {
  const [connections, setConnections] = useState<ProfessionalConnection[]>([])
  const [selectedConn, setSelectedConn] = useState<ProfessionalConnection | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      const data = await getConnections()
      setConnections(data)
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar conexões.', variant: 'destructive' })
    }
  }

  const handleGenerateLink = async () => {
    try {
      const res = await generateSubmissionLink('connection')
      const url = `${window.location.origin}/conexao-profissional/${res.token}`
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link Copiado!', description: url })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar link.', variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Conexões Profissionais</h1>
        <Button onClick={handleGenerateLink}>
          <LinkIcon className="w-4 h-4 mr-2" /> Gerar Link de Entrevista
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profissional</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.map((conn) => (
              <TableRow key={conn.id}>
                <TableCell className="font-medium">{conn.professional_name}</TableCell>
                <TableCell>{conn.email}</TableCell>
                <TableCell>{new Date(conn.created).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedConn(conn)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {connections.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Nenhuma conexão encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={!!selectedConn}
        onOpenChange={(open) => {
          if (!open) setSelectedConn(null)
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedConn && (
            <div id="print-area">
              <DialogHeader className="print:hidden">
                <DialogTitle className="flex justify-between items-center">
                  <span>Entrevista: {selectedConn.professional_name}</span>
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" /> Imprimir
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                <div className="bg-muted p-4 rounded">
                  <p>
                    <strong>Nome:</strong> {selectedConn.professional_name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedConn.email}
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold border-b pb-2">Respostas</h3>
                  {selectedConn.responses &&
                    Object.entries(selectedConn.responses).map(([k, v]) =>
                      v ? (
                        <div key={k} className="space-y-1">
                          <p className="font-semibold text-primary">
                            {k.replace('q', 'Pergunta ')}
                          </p>
                          <p className="bg-muted/30 p-3 rounded">{String(v)}</p>
                        </div>
                      ) : null,
                    )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
