import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, UserPlus, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EventRegistration, PlatformEvent } from '@/types'
import {
  getEventRegistrations,
  createEventRegistration,
  updateEventRegistration,
  deleteEventRegistration,
} from '@/services/event_registrations'
import { useToast } from '@/hooks/use-toast'

export function EventSubscribersModal({
  open,
  setOpen,
  event,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  event: PlatformEvent | null
}) {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const { toast } = useToast()

  const load = async () => {
    if (!event) return
    setIsLoading(true)
    try {
      const data = await getEventRegistrations(event.id)
      setRegistrations(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open, event])

  const handleAdd = async () => {
    if (!newName || !newEmail || !event) return
    try {
      await createEventRegistration({
        event: event.id,
        name: newName,
        email: newEmail,
        status: 'confirmed',
      })
      setNewName('')
      setNewEmail('')
      toast({ title: 'Inscrito adicionado' })
      load()
    } catch (err) {
      toast({ title: 'Erro ao adicionar inscrito', variant: 'destructive' })
    }
  }

  const handleStatusChange = async (id: string, status: any) => {
    try {
      await updateEventRegistration(id, { status })
      setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      toast({ title: 'Status atualizado' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este inscrito?')) return
    try {
      await deleteEventRegistration(id)
      setRegistrations((prev) => prev.filter((r) => r.id !== id))
      toast({ title: 'Inscrito removido' })
    } catch (err) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Inscritos - {event?.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="flex gap-2 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex-1">
              <Input
                placeholder="Nome Completo"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="E-mail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleAdd} disabled={!newName || !newEmail}>
              <UserPlus className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / Cargo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Acompanhantes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhum inscrito ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="font-medium">{reg.name}</div>
                        {reg.position && (
                          <div className="text-xs text-muted-foreground">{reg.position}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{reg.email}</div>
                        {reg.phone && (
                          <div className="text-xs text-muted-foreground">{reg.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {reg.extra_guests && reg.extra_guests.length > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {reg.extra_guests.length} convidados
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={reg.status}
                          onValueChange={(v) => handleStatusChange(reg.id, v)}
                        >
                          <SelectTrigger className="h-8 text-xs w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confirmed">Confirmado</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(reg.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
