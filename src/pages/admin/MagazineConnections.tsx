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
  getTokens,
} from '@/services/magazine_management'
import { getMagazines, updateMagazine } from '@/services/magazines'
import { ProfessionalConnection, Magazine } from '@/types'
import { Eye, Link as LinkIcon, Printer, Save, Copy, Settings } from 'lucide-react'
import { MagazineTabs } from '@/components/admin/MagazineTabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'

export default function AdminMagazineConnections() {
  const [connections, setConnections] = useState<ProfessionalConnection[]>([])
  const [selectedConn, setSelectedConn] = useState<ProfessionalConnection | null>(null)

  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [printMode, setPrintMode] = useState(false)

  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [tokens, setTokens] = useState<any[]>([])

  const [questionsModalOpen, setQuestionsModalOpen] = useState(false)
  const [selectedMagId, setSelectedMagId] = useState('')
  const [questionsText, setQuestionsText] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    load()
    getMagazines().then(setMagazines).catch(console.error)
  }, [])

  const load = async () => {
    try {
      const data = await getConnections()
      setConnections(data as unknown as ProfessionalConnection[])
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar conexões.', variant: 'destructive' })
    }
  }

  const loadTokens = async () => {
    try {
      const data = await getTokens('connection')
      setTokens(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenLinks = () => {
    setLinkModalOpen(true)
    loadTokens()
  }

  const handleGenerateLink = async () => {
    if (!recipientName.trim()) {
      toast({
        title: 'Aviso',
        description: 'Informe o nome do profissional.',
        variant: 'destructive',
      })
      return
    }
    try {
      await generateSubmissionLink('connection', recipientName)
      toast({ title: 'Link Gerado!', description: 'O link expira em 30 dias.' })
      setRecipientName('')
      loadTokens()
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar link.', variant: 'destructive' })
    }
  }

  const copyLink = async (tokenStr: string) => {
    const url = `${window.location.origin}/conexao-profissional/${tokenStr}`
    await navigator.clipboard.writeText(url)
    toast({ title: 'Link Copiado!' })
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

  const handleSaveQuestions = async () => {
    if (!selectedMagId) return
    try {
      const arr = questionsText.split('\n').filter((q) => q.trim().length > 0)
      const form = new FormData()
      form.set('connection_questions', JSON.stringify(arr))
      await updateMagazine(selectedMagId, form)
      toast({ title: 'Perguntas salvas com sucesso' })
      setQuestionsModalOpen(false)
    } catch {
      toast({ title: 'Erro ao salvar perguntas', variant: 'destructive' })
    }
  }

  const months = Array.from(new Set(connections.map((c) => c.edition_month || 'Não definido')))
  const filteredConnections = connections.filter(
    (c) => filterMonth === 'all' || (c.edition_month || 'Não definido') === filterMonth,
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-secondary">Conexões Profissionais</h1>
          <p className="text-muted-foreground mt-1">Gerencie respostas de entrevistas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setQuestionsModalOpen(true)}>
            <Settings className="w-4 h-4 mr-2" /> Configurar Perguntas
          </Button>
          <Button onClick={handleOpenLinks}>
            <LinkIcon className="w-4 h-4 mr-2" /> Gerenciar Links
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

      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Links para Conexão Profissional</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4 items-end border-b pb-6">
            <div className="flex-1 space-y-2">
              <Label>Nome do Profissional</Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ex: Eng. Marcos Almeida"
              />
            </div>
            <Button onClick={handleGenerateLink}>Gerar Novo Link (30 dias)</Button>
          </div>
          <div className="space-y-4 pt-2 max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-sm">{t.recipient_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="truncate w-32 text-xs text-slate-500">
                          {window.location.origin}/conexao-profissional/{t.token}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyLink(t.token)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(t.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {t.used ? (
                        <Badge variant="secondary">Usado</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={questionsModalOpen} onOpenChange={setQuestionsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Perguntas (Conexão Profissional)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecione a Revista-alvo</Label>
              <Select
                value={selectedMagId}
                onValueChange={(val) => {
                  setSelectedMagId(val)
                  const m = magazines.find((x) => x.id === val)
                  setQuestionsText((m as any)?.connection_questions?.join('\n') || '')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a edição..." />
                </SelectTrigger>
                <SelectContent>
                  {magazines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Perguntas da Entrevista (Uma por linha)</Label>
              <Textarea
                rows={8}
                value={questionsText}
                onChange={(e) => setQuestionsText(e.target.value)}
                placeholder="Insira as perguntas da entrevista aqui..."
                disabled={!selectedMagId}
              />
            </div>
            <Button onClick={handleSaveQuestions} disabled={!selectedMagId} className="w-full">
              Salvar Perguntas
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                      <Input
                        id="edition_month"
                        name="edition_month"
                        defaultValue={selectedConn.edition_month}
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
                      {Array.isArray(selectedConn.photos) ? (
                        selectedConn.photos.map((photo: string, idx: number) => (
                          <a
                            key={idx}
                            href={pb.files.getUrl(selectedConn, photo)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={pb.files.getUrl(selectedConn, photo, {
                                thumb: '100x100',
                              })}
                              className="w-24 h-24 object-cover border rounded hover:opacity-80 transition"
                            />
                          </a>
                        ))
                      ) : (
                        <a
                          href={pb.files.getUrl(selectedConn, selectedConn.photos)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={pb.files.getUrl(selectedConn, selectedConn.photos, {
                              thumb: '100x100',
                            })}
                            className="w-24 h-24 object-cover border rounded hover:opacity-80 transition"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <style>{`@media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 2cm; } }`}</style>
    </div>
  )
}
