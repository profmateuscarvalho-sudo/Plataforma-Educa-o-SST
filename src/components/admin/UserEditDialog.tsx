import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { User } from '@/types'
import { getProfessionalTagOptions } from '@/services/professional-tag-options'
import { Loader2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserEditDialogProps {
  user: User | null
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess: () => void
}

const PROFILES = [
  'Estudante',
  'Técnico em Segurança',
  'Engenheiro de Segurança',
  'Enfermeiro do Trabalho',
  'Médico do Trabalho',
  'Outros',
]

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'prata', label: 'Prata' },
  { value: 'ouro', label: 'Ouro' },
]

const BILLING = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
]

export function UserEditDialog({ user, open, setOpen, onSuccess }: UserEditDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profile, setProfile] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [planTier, setPlanTier] = useState('free')
  const [billing, setBilling] = useState('none')
  const [contractEnd, setContractEnd] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    getProfessionalTagOptions()
      .then((opts) => {
        setAvailableTags(opts.map((o: { name: string }) => o.name))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setProfile(user.professional_profile || '')
      setCity(user.city || '')
      setState(user.state || '')
      setPlanTier(user.plan_tier || 'free')
      setBilling(user.subscription_billing || 'none')
      setContractEnd(user.contract_end_date || '')
      setTags(user.professional_tags || [])
    }
  }, [user])

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await pb.collection('users').update(user.id, {
        name,
        email,
        phone,
        professional_profile: profile || undefined,
        city,
        state,
        plan_tier: planTier,
        subscription_billing: billing,
        contract_end_date: contractEnd || undefined,
        professional_tags: tags,
      })
      toast({ title: 'Aluno atualizado com sucesso' })
      setOpen(false)
      onSuccess()
    } catch (err) {
      toast({
        title: 'Erro ao atualizar aluno',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Aluno</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do aluno"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">E-mail</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefone</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label>Perfil Profissional</Label>
            <Select value={profile} onValueChange={setProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
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

          <div className="space-y-2">
            <Label htmlFor="edit-city">Cidade</Label>
            <Input
              id="edit-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-state">Estado</Label>
            <Input
              id="edit-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="UF"
            />
          </div>

          <div className="space-y-2">
            <Label>Plano</Label>
            <Select value={planTier} onValueChange={setPlanTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cobrança</Label>
            <Select value={billing} onValueChange={setBilling}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILLING.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="edit-contract-end">Data de Validade</Label>
            <Input
              id="edit-contract-end"
              type="date"
              value={contractEnd}
              onChange={(e) => setContractEnd(e.target.value)}
            />
          </div>

          {availableTags.length > 0 && (
            <div className="space-y-2 lg:col-span-2">
              <Label>Tags Profissionais</Label>
              <div className="flex flex-wrap gap-2 rounded-md border bg-slate-50 p-3">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      tags.includes(tag)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
