import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { Loader2, CreditCard } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export function CheckoutModal({
  isOpen,
  setIsOpen,
  itemTitle,
  price,
}: {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  itemTitle: string
  price: number
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: 'Atenção',
        description: 'Você precisa estar logado para comprar.',
        variant: 'destructive',
      })
      navigate('/login')
      return
    }

    setIsProcessing(true)
    // Simulate Stripe/Mercado Pago gateway processing
    setTimeout(() => {
      setIsProcessing(false)
      setIsOpen(false)
      toast({
        title: 'Pagamento Aprovado!',
        description: 'O conteúdo já está disponível na sua Área do Aluno.',
      })
      navigate('/aluno')
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Finalizar Compra</DialogTitle>
          <DialogDescription>Ambiente seguro integrado com Stripe.</DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border">
            <div>
              <p className="font-semibold text-slate-800">{itemTitle}</p>
              <p className="text-sm text-slate-500">Acesso vitalício</p>
            </div>
            <p className="font-bold text-lg text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
            </p>
          </div>

          <Button className="w-full h-12 text-lg" onClick={handleCheckout} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" /> Pagar com Cartão
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
