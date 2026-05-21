import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Copy, Trash2, Send } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { PlatformEvent, WorkshopInvitation } from '@/types'

export default function AdminWorkshops() {
  const [workshops, setWorkshops] = useState<PlatformEvent[]>([])
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>('')
  const [invites, setInvites] = useState<WorkshopInvitation[]>([])
  const [newGuestName, setNewGuestName] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    pb.collection('events')
      .getFullList<PlatformEvent>({ filter: 'is_workshop=true', sort: '-created' })
      .then((data) => {
        setWorkshops(data)
        if (data.length > 0) setSelectedWorkshopId(data[0].id)
      })
  }, [])

  useEffect(() => {
    if (!selectedWorkshopId) {
      setInvites([])
      return
    }
    pb.collection('workshop_invitations')
      .getFullList<WorkshopInvitation>({
        filter: `event="${selectedWorkshopId}"`,
        sort: '-created',
      })
      .then(setInvites)
  }, [selectedWorkshopId])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGuestName.trim() || !selectedWorkshopId) return
    setLoading(true)

    // Generate a secure random token
    const token =
      Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)

    try {
      const newInv = await pb.collection('workshop_invitations').create<WorkshopInvitation>({
        event: selectedWorkshopId,
        guest_name: newGuestName.trim(),
        token,
        status: 'pending',
      })
      setInvites([newInv, ...invites])
      setNewGuestName('')
      toast({ title: 'Convite gerado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao gerar convite', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const copyToWhatsApp = (inv: WorkshopInvitation) => {
    const url = `${window.location.origin}/convite/${inv.token}`
    const text = `Olá ${inv.guest_name}, você é nosso convidado especial! Acesse seu convite VIP aqui:\n${url}`
    navigator.clipboard.writeText(text)
    toast({ title: 'Mensagem copiada!', description: 'Cole no WhatsApp do convidado.' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este convite?')) return
    try {
      await pb.collection('workshop_invitations').delete(id)
      setInvites(invites.filter((i) => i.id !== id))
      toast({ title: 'Convite excluído' })
    } catch (err) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-serif font-bold text-secondary">Gestão de Eventos VIP</h2>
        <p className="text-muted-foreground mt-1">
          Gere convites nominais de alto impacto para Workshops e Summits via WhatsApp.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerador de Convites VIP</CardTitle>
          <CardDescription>
            Selecione o evento VIP e informe o nome do convidado para gerar o link exclusivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleGenerate}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
          >
            <div className="md:col-span-4">
              <Label>Evento</Label>
              <Select value={selectedWorkshopId} onValueChange={setSelectedWorkshopId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.title}
                    </SelectItem>
                  ))}
                  {workshops.length === 0 && (
                    <SelectItem value="none" disabled>
                      Nenhum evento VIP encontrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5">
              <Label>Nome do Convidado (Ex: Mateus Carvalho)</Label>
              <Input
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                placeholder="Nome completo ou empresa"
              />
            </div>
            <div className="md:col-span-3">
              <Button
                type="submit"
                disabled={loading || !newGuestName.trim() || !selectedWorkshopId}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Gerar Link
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Convidado</TableHead>
                <TableHead>Token / Link</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.guest_name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {inv.token}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inv.status === 'confirmed'
                          ? 'default'
                          : inv.status === 'viewed'
                            ? 'secondary'
                            : inv.status === 'declined'
                              ? 'destructive'
                              : 'outline'
                      }
                    >
                      {inv.status === 'confirmed'
                        ? 'Confirmado'
                        : inv.status === 'viewed'
                          ? 'Visualizou'
                          : inv.status === 'declined'
                            ? 'Recusado'
                            : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyToWhatsApp(inv)}>
                      <Copy className="w-4 h-4 mr-2" /> Copiar para WhatsApp
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => handleDelete(inv.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum convite gerado para este workshop.
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
