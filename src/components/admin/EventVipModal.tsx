import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail } from 'lucide-react'
import { PlatformEvent } from '@/types'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export function EventVipModal({
  open,
  setOpen,
  event,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  event: PlatformEvent | null
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!event) return
    setIsSubmitting(true)
    const fd = new FormData(e.currentTarget)
    try {
      await pb.collection('workshop_invitations').create({
        event: event.id,
        guest_name: fd.get('guest_name'),
        guest_email: fd.get('guest_email'),
        token: crypto.randomUUID(),
        status: 'pending',
      })
      toast({ title: 'Convite VIP enviado com sucesso!' })
      setOpen(false)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao enviar convite VIP', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Convite VIP</DialogTitle>
          <DialogDescription>
            Gere um convite exclusivo para o evento {event?.title}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label>Nome do Convidado *</Label>
            <Input name="guest_name" required placeholder="Ex: João Silva" />
          </div>
          <div>
            <Label>E-mail do Convidado *</Label>
            <Input name="guest_email" type="email" required placeholder="joao@empresa.com" />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Enviar Convite
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
