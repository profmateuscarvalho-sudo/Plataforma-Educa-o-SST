import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, X } from 'lucide-react'
import { createSubscriptionPlan, updateSubscriptionPlan } from '@/services/subscription-plans'
import { SubscriptionPlan } from '@/types'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionPlanFormModalProps {
  open: boolean
  setOpen: (v: boolean) => void
  editingPlan: SubscriptionPlan | null
  onSuccess: () => void
}

export function SubscriptionPlanFormModal({
  open,
  setOpen,
  editingPlan,
  onSuccess,
}: SubscriptionPlanFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [priceYearly, setPriceYearly] = useState('')
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [isComingSoon, setIsComingSoon] = useState(false)
  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setErrors({})
      setName(editingPlan?.name || '')
      setDescription(editingPlan?.description || '')
      setPrice(editingPlan?.price != null ? String(editingPlan.price) : '')
      setPriceYearly(editingPlan?.price_yearly != null ? String(editingPlan.price_yearly) : '')
      setInterval(editingPlan?.interval || 'monthly')
      setIsComingSoon(editingPlan?.is_coming_soon ?? false)
      setFeatures(Array.isArray(editingPlan?.features) ? (editingPlan!.features as string[]) : [])
      setNewFeature('')
    }
  }, [open, editingPlan])

  const handleAddFeature = () => {
    const trimmed = newFeature.trim()
    if (!trimmed) return
    setFeatures([...features, trimmed])
    setNewFeature('')
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddFeature()
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'O nome é obrigatório.'
    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice < 0) errs.price = 'O preço deve ser um número válido.'
    if (priceYearly) {
      const numYearly = parseFloat(priceYearly)
      if (isNaN(numYearly) || numYearly < 0)
        errs.priceYearly = 'O preço anual deve ser um número válido.'
    }
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        interval,
        features: JSON.stringify(features),
        is_coming_soon: isComingSoon,
      }

      if (priceYearly) {
        payload.price_yearly = parseFloat(priceYearly)
      }

      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, payload)
        toast({ title: 'Plano atualizado com sucesso' })
      } else {
        await createSubscriptionPlan(payload)
        toast({ title: 'Plano criado com sucesso' })
      }
      onSuccess()
      setOpen(false)
    } catch (err) {
      toast({ title: 'Erro ao salvar plano', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPlan ? 'Editar Plano' : 'Criar Plano de Assinatura'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div>
            <Label>Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Plano Premium"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do plano..."
              className="h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Preço Mensal (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 49.90"
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <Label>Preço Anual (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={priceYearly}
                onChange={(e) => setPriceYearly(e.target.value)}
                placeholder="Ex: 358.80"
              />
              {errors.priceYearly && (
                <p className="text-xs text-red-500 mt-1">{errors.priceYearly}</p>
              )}
            </div>
            <div>
              <Label>Intervalo *</Label>
              <Select
                value={interval}
                onValueChange={(v) => setInterval(v as 'monthly' | 'yearly')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-base font-semibold">Em breve</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Marque este plano como "Em breve" para exibir o selo na página inicial e desabilitar
                o botão de assinatura.
              </p>
            </div>
            <Switch checked={isComingSoon} onCheckedChange={setIsComingSoon} />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Produtos / Funcionalidades Inclusas</Label>
            <p className="text-sm text-muted-foreground">
              Adicione os benefícios, cursos ou produtos inclusos neste plano.
            </p>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Acesso a todos os cursos"
              />
              <Button type="button" variant="outline" onClick={handleAddFeature}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
            {features.length > 0 && (
              <div className="space-y-2 mt-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-50 border rounded-md px-3 py-2"
                  >
                    <span className="text-sm text-slate-700">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {features.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma funcionalidade adicionada ainda.
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
