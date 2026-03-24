import React, { useState, useEffect } from 'react'
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

export function CheckoutModal({
  open,
  isOpen,
  setOpen,
  setIsOpen,
  onOpenChange,
  onClose,
  title,
  itemTitle,
  course,
  item,
  price,
  itemPrice,
}: any) {
  const isModalOpen = open !== undefined ? open : isOpen
  const handleOpen = setIsOpen || setOpen

  const handleOpenChange = (val: boolean) => {
    if (handleOpen) handleOpen(val)
    if (onOpenChange) onOpenChange(val)
    if (!val && onClose) onClose()
  }

  const displayTitle = title || itemTitle || course?.title || item?.title || 'Item selecionado'
  const displayPrice = price ?? itemPrice ?? course?.price ?? item?.price ?? 0

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isModalOpen) {
      setIsSuccess(false)
      setIsLoading(false)
    }
  }, [isModalOpen])

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const payload = {
      amount: displayPrice,
      item: displayTitle,
      card_name: formData.get('card_name'),
      card_number: formData.get('card_number'),
      expiry: formData.get('expiry'),
      cvv: formData.get('cvv'),
    }

    try {
      const response = await pb.send('/backend/v1/ipag/pay', {
        method: 'POST',
        body: payload,
      })

      if (response && response.status === 'approved') {
        setIsSuccess(true)
        toast({ title: 'Pagamento processado com sucesso!' })
        setTimeout(() => {
          handleOpenChange(false)
        }, 3000)
      } else {
        throw new Error('Falha no processamento.')
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao processar pagamento',
        description: err?.message || 'Verifique os dados do cartão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <DialogTitle className="text-2xl">Compra Aprovada!</DialogTitle>
            <p className="text-muted-foreground">
              Sua transação foi concluída com sucesso via iPag. Você receberá o comprovante por
              e-mail.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Finalizar Compra</DialogTitle>
              <DialogDescription>
                Você está adquirindo:{' '}
                <span className="font-semibold text-foreground">{displayTitle}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-6 text-center bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">Total a pagar</p>
                <p className="text-3xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    displayPrice,
                  )}
                </p>
              </div>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Impresso no Cartão</Label>
                  <Input name="card_name" required placeholder="JOÃO M SILVA" />
                </div>
                <div className="space-y-2">
                  <Label>Número do Cartão</Label>
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
                <Button
                  type="submit"
                  className="w-full h-12 text-lg mt-2 shadow-lg shadow-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-5 h-5 mr-2" />
                  )}
                  Pagar de Forma Segura
                </Button>
                <p className="text-xs text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
                  Processamento seguro via iPag Gateway
                </p>
              </form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
