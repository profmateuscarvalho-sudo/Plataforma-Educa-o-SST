import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Edit, BadgeCent, Clock } from 'lucide-react'
import { getSubscriptionPlans, deleteSubscriptionPlan } from '@/services/subscription-plans'
import { SubscriptionPlan } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { SubscriptionPlanFormModal } from '@/components/admin/SubscriptionPlanFormModal'

export default function AdminSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [activePlan, setActivePlan] = useState<SubscriptionPlan | null>(null)
  const { toast } = useToast()

  const load = async () => {
    try {
      const data = await getSubscriptionPlans()
      setPlans(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('subscription_plans', () => load())

  const handleOpenForm = (plan?: SubscriptionPlan) => {
    setActivePlan(plan || null)
    setFormOpen(true)
  }

  const handleDelete = async (plan: SubscriptionPlan) => {
    if (!confirm('Deseja realmente excluir este plano?')) return
    try {
      await deleteSubscriptionPlan(plan.id)
      toast({ title: 'Plano excluído com sucesso' })
    } catch {
      toast({ title: 'Erro ao excluir plano', variant: 'destructive' })
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Planos de Assinatura</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os planos comerciais da plataforma, seus preços e benefícios.
          </p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 w-4 h-4" /> Novo Plano
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço Mensal</TableHead>
                <TableHead>Preço Anual</TableHead>
                <TableHead>Intervalo</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Funcionalidades</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <div>
                      {plan.name}
                      {plan.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    {formatPrice(plan.price)}
                  </TableCell>
                  <TableCell className="font-medium text-slate-600">
                    {plan.price_yearly != null ? formatPrice(plan.price_yearly) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.interval === 'yearly' ? 'default' : 'secondary'}>
                      {plan.interval === 'monthly' ? 'Mensal' : 'Anual'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {plan.is_coming_soon ? (
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-400 bg-amber-50"
                      >
                        <Clock className="w-3 h-3 mr-1" /> Em breve
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-emerald-600 border-emerald-400 bg-emerald-50"
                      >
                        Ativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <BadgeCent className="w-4 h-4" />
                      {Array.isArray(plan.features) ? plan.features.length : 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      onClick={() => handleOpenForm(plan)}
                    >
                      <Edit className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      title="Excluir"
                      onClick={() => handleDelete(plan)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum plano cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SubscriptionPlanFormModal
        open={formOpen}
        setOpen={setFormOpen}
        editingPlan={activePlan}
        onSuccess={load}
      />
    </div>
  )
}
