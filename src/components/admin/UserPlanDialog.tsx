import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { updateUserPlan } from '@/services/users'
import { User } from '@/types'
import { useToast } from '@/hooks/use-toast'

interface UserPlanDialogProps {
  user: User | null
  open: boolean
  setOpen: (v: boolean) => void
  onSuccess: () => void
}

export function UserPlanDialog({ user, open, setOpen, onSuccess }: UserPlanDialogProps) {
  const [planTier, setPlanTier] = useState('free')
  const [billing, setBilling] = useState('none')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      setPlanTier(user.plan_tier || 'free')
      setBilling(user.subscription_billing || 'none')
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateUserPlan(user.id, planTier, billing)
      toast({ title: 'Plano atualizado com sucesso' })
      onSuccess()
      setOpen(false)
    } catch {
      toast({ title: 'Erro ao atualizar plano', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Plano — {user?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select value={planTier} onValueChange={setPlanTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="prata">Prata</SelectItem>
                <SelectItem value="ouro">Ouro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ciclo de Cobrança</Label>
            <Select value={billing} onValueChange={setBilling}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
