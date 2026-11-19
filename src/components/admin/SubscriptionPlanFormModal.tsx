import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus, X } from 'lucide-react'
import { createSubscriptionPlan, updateSubscriptionPlan } from '@/services/subscription-plans'
import { SubscriptionPlan } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { calcularPrecosPlanos, formatBRL } from '@/lib/pricing'

interface SubscriptionPlanFormModalProps {
  open: boolean
  setOpen: (v: boolean) => void
  editingPlan: SubscriptionPlan | null
  onSuccess: () => void
}

const parseInputNumber = (v: string): number | null => {
  if (!v.trim()) return null
  const n = parseFloat(v.replace(',', '.'))
  return isNaN(n) ? null : n
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
  const [price, setPrice] = useState('') // valor MENSAL de referência
  const [isComingSoon, setIsComingSoon] = useState(false)
  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Promoção
  const [promoActive, setPromoActive] = useState(false)
  const [promoMonthlyPrice, setPromoMonthlyPrice] = useState('')
  const [promoEndsAt, setPromoEndsAt] = useState('') // yyyy-mm-dd
  const [promoLabel, setPromoLabel] = useState('')

  useEffect(() => {
    if (open) {
      setErrors({})
      setName(editingPlan?.name || '')
      setDescription(editingPlan?.description || '')
      setPrice(editingPlan?.price != null ? String(editingPlan.price) : '')
      setIsComingSoon(editingPlan?.is_coming_soon ?? false)
      setFeatures(Array.isArray(editingPlan?.features) ? (editingPlan!.features as string[]) : [])
      setNewFeature('')
      setPromoActive(!!editingPlan?.promo_active)
      setPromoMonthlyPrice(
        editingPlan?.promo_monthly_price != null ? String(editingPlan.promo_monthly_price) : '',
      )
      setPromoEndsAt(editingPlan?.promo_ends_at ? editingPlan.promo_ends_at.slice(0, 10) : '')
      setPromoLabel(editingPlan?.promo_label || '')
    }
  }, [open, editingPlan])

  // Prévia ao vivo — a MESMA função usada nas páginas públicas e no backend.
  const priceNum = parseInputNumber(price) ?? 0
  const preview = useMemo(
    () =>
      calcularPrecosPlanos(priceNum, {
        active: promoActive,
        monthlyPrice: parseInputNumber(promoMonthlyPrice) ?? 0,
        endsAt: promoEndsAt ? `${promoEndsAt} 23:59:59` : undefined,
        label: promoLabel,
      }),
    [priceNum, promoActive, promoMonthlyPrice, promoEndsAt, promoLabel],
  )

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
    const numPrice = parseInputNumber(price)
    if (numPrice == null || numPrice < 0)
      errs.price = 'O valor mensal deve ser um número maior ou igual a 0.'

    if (promoActive) {
      const numPromo = parseInputNumber(promoMonthlyPrice)
      if (numPromo == null || numPromo < 0) {
        errs.promoMonthlyPrice = 'Informe o valor mensal promocional (≥ 0).'
      } else if (numPrice != null && numPrice > 0 && numPromo >= numPrice) {
        errs.promoMonthlyPrice = 'O valor promocional deve ser MENOR que o valor normal.'
      } else if (numPromo === 0 && (numPrice == null || numPrice <= 0)) {
        errs.promoMonthlyPrice = 'O valor promocional deve ser MENOR que o valor normal.'
      }
      if (!promoEndsAt) {
        errs.promoEndsAt = 'Informe a data de término da promoção.'
      } else {
        const end = new Date(`${promoEndsAt}T23:59:59-03:00`)
        if (isNaN(end.getTime())) {
          errs.promoEndsAt = 'Data inválida.'
        } else if (end.getTime() < Date.now()) {
          errs.promoEndsAt = 'A data de término deve ser futura.'
        }
      }
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
        price: parseInputNumber(price) ?? 0,
        interval: 'yearly', // a plataforma vende SOMENTE assinatura anual
        features: features,
        is_coming_soon: isComingSoon,
        promo_active: promoActive,
        promo_monthly_price: promoActive ? (parseInputNumber(promoMonthlyPrice) ?? 0) : 0,
        promo_ends_at: promoActive && promoEndsAt ? `${promoEndsAt} 23:59:59.000Z` : '',
        promo_label: promoActive ? promoLabel.trim() : '',
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
      setErrors(extractFieldErrors(err))
      toast({
        title: 'Erro ao salvar plano',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
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

          <div>
            <Label>Valor Mensal de Referência (R$) *</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Todos os planos são anuais: até 12x sem juros no cartão ou à vista no Pix com 20% de
              desconto. Informe apenas o valor mensal.
            </p>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 14.90"
              className="mt-1"
            />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
          </div>

          {/* Prévia ao vivo com a mesma função do site e do backend */}
          <div className="rounded-lg border bg-slate-50 p-4 space-y-1.5">
            <p className="text-sm font-semibold">Prévia (calculada pela função oficial)</p>
            {preview.promoActive && (
              <p className="text-sm text-muted-foreground">
                <span className="line-through">{formatBRL(preview.withoutPromo!.installment)}</span>{' '}
                →{' '}
                <span className="font-semibold text-emerald-700">
                  {formatBRL(preview.installment)}
                </span>{' '}
                promocionais
              </p>
            )}
            <p className="text-sm">
              Anual no cartão:{' '}
              <span className="font-semibold">{formatBRL(preview.yearlyCardTotal)}</span> — 12x de{' '}
              <span className="font-semibold">{formatBRL(preview.installment)}</span>
            </p>
            <p className="text-sm">
              Anual no Pix (20% off):{' '}
              <span className="font-semibold">
                {formatBRL(preview.yearlyPixTotal).replace(/,00$/, '')}
              </span>{' '}
              à vista — equivale a {formatBRL(preview.monthlyPixEquivalent)}/mês
            </p>
            {preview.promoActive && preview.withoutPromo && (
              <p className="text-sm text-muted-foreground">
                Sem promoção: cartão {formatBRL(preview.withoutPromo.yearlyCardTotal)} (12x de{' '}
                {formatBRL(preview.withoutPromo.installment)}), Pix{' '}
                {formatBRL(preview.withoutPromo.yearlyPixTotal).replace(/,00$/, '')}
              </p>
            )}
          </div>

          {/* Promoção */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Promoção</Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Desconto no valor mensal, com data de término e rótulo (ex.: "Black Friday").
                </p>
              </div>
              <Switch checked={promoActive} onCheckedChange={setPromoActive} />
            </div>
            {promoActive && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Valor mensal promocional (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={promoMonthlyPrice}
                    onChange={(e) => setPromoMonthlyPrice(e.target.value)}
                    placeholder="Ex: 9.90"
                  />
                  {errors.promoMonthlyPrice && (
                    <p className="text-xs text-red-500 mt-1">{errors.promoMonthlyPrice}</p>
                  )}
                </div>
                <div>
                  <Label>Válida até *</Label>
                  <Input
                    type="date"
                    value={promoEndsAt}
                    onChange={(e) => setPromoEndsAt(e.target.value)}
                  />
                  {errors.promoEndsAt && (
                    <p className="text-xs text-red-500 mt-1">{errors.promoEndsAt}</p>
                  )}
                </div>
                <div>
                  <Label>Rótulo</Label>
                  <Input
                    value={promoLabel}
                    onChange={(e) => setPromoLabel(e.target.value)}
                    placeholder="Ex: Black Friday"
                    maxLength={100}
                  />
                </div>
              </div>
            )}
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
