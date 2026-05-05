import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Loader2, Copy, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PlatformEvent, WorkshopInvitation } from '@/types'
import { getInvitations, createInvitation, deleteInvitation } from '@/services/workshop'

export function WorkshopGuestModal({
  open,
  setOpen,
  event,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  event: PlatformEvent | null
}) {
  const [invites, setInvites] = useState<WorkshopInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [newGuestName, setNewGuestName] = useState('')
  const { toast } = useToast()

  const load = async () => {
    if (!event) return
    try {
      const data = await getInvitations(event.id)
      setInvites(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open, event])

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGuestName.trim() || !event) return
    setLoading(true)

    const slug =
      newGuestName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Math.floor(Math.random() * 1000)

    try {
      await createInvitation({
        event: event.id,
        guest_name: newGuestName.trim(),
        slug,
        status: 'pending',
      })
      setNewGuestName('')
      toast({ title: 'Convidado adicionado com sucesso!' })
      load()
    } catch (err) {
      toast({ title: 'Erro ao adicionar convidado', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/backend/v1/share/convite/${slug}`
    navigator.clipboard.writeText(url)
    toast({ title: 'Link WhatsApp copiado!' })
  }

  const removeInvite = async (id: string) => {
    if (!confirm('Excluir este convite?')) return
    try {
      await deleteInvitation(id)
      load()
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Convidados VIP: {event?.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddGuest} className="flex gap-2 my-4">
          <Input
            value={newGuestName}
            onChange={(e) => setNewGuestName(e.target.value)}
            placeholder="Nome do Convidado (Empresário/Líder)"
          />
          <Button type="submit" disabled={loading || !newGuestName.trim()}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}{' '}
            Adicionar
          </Button>
        </form>

        <div className="border rounded-md max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Convidado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.guest_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inv.status === 'confirmed'
                          ? 'default'
                          : inv.status === 'declined'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {inv.status === 'confirmed'
                        ? 'Confirmado'
                        : inv.status === 'declined'
                          ? 'Recusado'
                          : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyLink(inv.slug)}>
                      <Copy className="w-4 h-4 mr-2" /> Link WhatsApp
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => removeInvite(inv.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhum convidado adicionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
