import { useState, useEffect } from 'react'
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
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { SubscriptionPlan } from '@/types'

export function SubscriptionCheckoutModal({
  isOpen,
  setIsOpen,
  plan,
}: {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  plan: SubscriptionPlan | null
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()
  const { refreshUser } = useAuth()

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false)
      setIsLoading(false)
    }
  }, [isOpen])

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!plan) return
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      const response = await pb.send('/backend/v1/ipag/subscription/pay', {
        method: 'POST',
        body: {
          plan_id: plan.id,
          card_name: formData.get('card_name'),
          card_number: formData.get('card_number'),
          expiry: formData.get('expiry'),
          cvv: formData.get('cvv'),
        },
      })

      if (response && response.status === 'approved') {
        setIsSuccess(true)
        toast({ title: 'Assinatura ativada com sucesso!' })
        await refreshUser()
        setTimeout(() => setIsOpen(false), 3000)
      } else {
        throw new Error('Falha no processamento.')
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao processar pagamento',
        description: err?.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!plan) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <DialogTitle className="text-2xl">Assinatura Ativada!</DialogTitle>
            <p className="text-muted-foreground">
              Seu acesso foi estendido com sucesso. Aproveite todos os cursos e materiais da
              plataforma.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Assinar {plan.name}</DialogTitle>
              <DialogDescription>Pagamento via iPag - ambiente seguro.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-6 text-center bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm text-muted-foreground font-medium">{plan.name}</p>
                  <p className="text-xs text-slate-400">
                    Cobranca {plan.interval === 'monthly' ? 'mensal' : 'anual'}
                  </p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(plan.price)}
                </p>
              </div>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome no Cartao</Label>
                  <Input name="card_name" required placeholder="JOAO M SILVA" />
                </div>
                <div className="space-y-2">
                  <Label>Numero do Cartao</Label>
                  <Input
                    name="card_number"
                    required
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Validade (MM/AA)</Label>
                    <Input name="expiry" required placeholder="12/29" maxLength={5} />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input name="cvv" required placeholder="123" maxLength={4} type="password" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-lg mt-2" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-5 h-5 mr-2" />
                  )}
                  Pagar de Forma Segura
                </Button>
              </form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
