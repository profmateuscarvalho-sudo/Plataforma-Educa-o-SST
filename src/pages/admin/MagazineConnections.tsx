import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
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
import {
  getConnections,
  generateSubmissionLink,
  updateConnection,
} from '@/services/magazine_management'
import { ProfessionalConnection } from '@/types'
import { Eye, Link as LinkIcon, Printer, Save, Copy } from 'lucide-react'
import { MagazineTabs } from '@/components/admin/MagazineTabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'

export default function AdminMagazineConnections() {
  const [connections, setConnections] = useState<ProfessionalConnection[]>([])
  const [selectedConn, setSelectedConn] = useState<ProfessionalConnection | null>(null)

  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [generatedLink, setGeneratedLink] = useState('')
  const [printMode, setPrintMode] = useState(false)
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
      setGeneratedLink(url)
      toast({ title: 'Link Gerado!', description: 'O link expira em 7 dias.' })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar link.', variant: 'destructive' })
    }
  }

  const copyLink = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink)
      toast({ title: 'Link Copiado!' })
    }
  }

  const handleSaveMonth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedConn) return
    const fd = new FormData(e.currentTarget)
    const month = fd.get('edition_month') as string
    try {
      await updateConnection(selectedConn.id, { edition_month: month })
      toast({ title: 'Mês da edição salvo' })
      load()
      setSelectedConn({ ...selectedConn, edition_month: month } as ProfessionalConnection)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const months = Array.from(new Set(connections.map((c) => c.edition_month || 'Não definido')))

  const filteredConnections = connections.filter((c) => {
    if (filterMonth !== 'all') {
      const m = c.edition_month || 'Não definido'
      return m === filterMonth
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-secondary">Conexões Profissionais</h1>
          <p className="text-muted-foreground mt-1">Gerencie respostas de entrevistas.</p>
        </div>
        <div className="flex items-center gap-2">
          {generatedLink && (
            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded border text-sm">
              <span className="truncate w-48 text-slate-600">{generatedLink}</span>
              <Button size="icon" variant="ghost" onClick={copyLink} className="h-6 w-6">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          )}
          <Button onClick={handleGenerateLink}>
            <LinkIcon className="w-4 h-4 mr-2" /> Gerar Link (Expira em 7 dias)
          </Button>
        </div>
      </div>

      <MagazineTabs />

      <div className="flex gap-4 mb-4">
        <div className="w-64">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Mês da Edição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Meses</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profissional</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Mês da Edição</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConnections.map((conn) => (
              <TableRow key={conn.id}>
                <TableCell className="font-medium">{conn.professional_name}</TableCell>
                <TableCell>{conn.email}</TableCell>
                <TableCell>{new Date(conn.created).toLocaleDateString()}</TableCell>
                <TableCell>{conn.edition_month || '-'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedConn(conn)}>
                    <Eye className="w-4 h-4 mr-1" /> Ver / Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredConnections.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
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
          if (!open) {
            setSelectedConn(null)
            setPrintMode(false)
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedConn && (
            <div
              id={printMode ? 'print-area' : undefined}
              className={printMode ? 'p-8 bg-white text-black font-serif' : ''}
            >
              <DialogHeader className={printMode ? 'hidden' : 'mb-4'}>
                <DialogTitle className="flex justify-between items-center text-xl">
                  <span>Entrevista: {selectedConn.professional_name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPrintMode(true)
                      setTimeout(() => window.print(), 200)
                      setTimeout(() => setPrintMode(false), 2000)
                    }}
                  >
                    <Printer className="w-4 h-4 mr-2" /> PDF / Imprimir
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-md print:bg-transparent print:p-0">
                  <p>
                    <strong>Nome:</strong> {selectedConn.professional_name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedConn.email}
                  </p>
                </div>

                {!printMode && (
                  <form
                    onSubmit={handleSaveMonth}
                    className="flex gap-4 items-end bg-slate-50 p-4 rounded-md"
                  >
                    <div className="flex-1">
                      <Label htmlFor="edition_month">Mês da Edição</Label>
                      <input
                        id="edition_month"
                        name="edition_month"
                        defaultValue={selectedConn.edition_month}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Ex: Janeiro/2026"
                      />
                    </div>
                    <Button type="submit">
                      <Save className="w-4 h-4 mr-2" /> Salvar Mês
                    </Button>
                  </form>
                )}

                <div className="space-y-4">
                  <h3 className="text-xl font-bold border-b pb-2">Respostas</h3>
                  {selectedConn.responses &&
                    Object.entries(selectedConn.responses).map(([k, v]) =>
                      v ? (
                        <div key={k} className="space-y-1">
                          <p className="font-semibold text-primary">
                            {k.replace('q', 'Pergunta ')}
                          </p>
                          <p className="bg-slate-50 p-3 rounded text-slate-800 whitespace-pre-wrap print:bg-transparent print:p-0">
                            {String(v)}
                          </p>
                        </div>
                      ) : null,
                    )}
                </div>

                {selectedConn.photos && !printMode && (
                  <div className="space-y-2 mt-4">
                    <Label>Fotos Enviadas</Label>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={pb.files.getUrl(selectedConn, selectedConn.photos)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={pb.files.getUrl(selectedConn, selectedConn.photos, {
                            thumb: '100x100',
                          })}
                          className="w-24 h-24 object-cover border rounded"
                        />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2cm;
          }
        }
      `}</style>
    </div>
  )
}
