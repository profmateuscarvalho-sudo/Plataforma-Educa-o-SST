import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { updateUserProfile } from '@/services/users'
import { User } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const PROFILES = [
  'Estudante',
  'Técnico em Segurança',
  'Engenheiro de Segurança',
  'Enfermeiro do Trabalho',
  'Médico do Trabalho',
  'Outros',
]

interface Props {
  user: User | null
  open: boolean
  setOpen: (v: boolean) => void
  onSuccess: () => void
}

export function UserEditDialog({ user, open, setOpen, onSuccess }: Props) {
  const [form, setForm] = useState<Record<string, any>>({})
  const [tagsText, setTagsText] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        professional_profile: user.professional_profile || '',
        city: user.city || '',
        state: user.state || '',
        plan_tier: user.plan_tier || 'free',
        subscription_billing: user.subscription_billing || 'none',
        contract_end_date: user.contract_end_date || '',
        email_verificado: user.email_verificado || false,
      })
      setTagsText((user.professional_tags || []).join(', '))
    }
  }, [user])

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }))

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      await updateUserProfile(user.id, { ...form, professional_tags: tags })
      toast({ title: 'Perfil atualizado com sucesso' })
      onSuccess()
      setOpen(false)
    } catch {
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = 'space-y-1.5'
  const inputClass = 'h-10'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Aluno — {user?.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 pt-2">
          <div className={cn(fieldClass, 'md:col-span-2')}>
            <Label>Nome Completo</Label>
            <Input
              className={inputClass}
              value={form.name || ''}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Nome do aluno"
            />
          </div>
          <div className={fieldClass}>
            <Label>Telefone</Label>
            <Input
              className={inputClass}
              value={form.phone || ''}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className={fieldClass}>
            <Label>Perfil Profissional</Label>
            <Select
              value={form.professional_profile || ''}
              onValueChange={(v) => set('professional_profile', v)}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {PROFILES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={cn(fieldClass, 'md:col-span-2')}>
            <Label>Tags Profissionais (separadas por vírgula)</Label>
            <Input
              className={inputClass}
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="NR-10, SST, Ergonomia"
            />
          </div>
          <div className={fieldClass}>
            <Label>Cidade</Label>
            <Input
              className={inputClass}
              value={form.city || ''}
              onChange={(e) => set('city', e.target.value)}
              placeholder="Cidade"
            />
          </div>
          <div className={fieldClass}>
            <Label>Estado</Label>
            <Input
              className={inputClass}
              value={form.state || ''}
              onChange={(e) => set('state', e.target.value)}
              placeholder="UF"
            />
          </div>
          <div className={fieldClass}>
            <Label>Plano</Label>
            <Select value={form.plan_tier || 'free'} onValueChange={(v) => set('plan_tier', v)}>
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="prata">Prata</SelectItem>
                <SelectItem value="ouro">Ouro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className={fieldClass}>
            <Label>Ciclo de Cobrança</Label>
            <Select
              value={form.subscription_billing || 'none'}
              onValueChange={(v) => set('subscription_billing', v)}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className={fieldClass}>
            <Label>Data de Validade do Contrato</Label>
            <Input
              className={inputClass}
              type="date"
              value={form.contract_end_date ? form.contract_end_date.split(' ')[0] : ''}
              onChange={(e) => set('contract_end_date', e.target.value)}
            />
          </div>
          <div className={cn(fieldClass, 'md:col-span-2', 'flex items-end')}>
            <Button onClick={handleSave} disabled={saving} className="w-full h-10">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
