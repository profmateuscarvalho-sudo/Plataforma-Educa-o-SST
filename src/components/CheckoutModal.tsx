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

export function CheckoutModal({
  open,
  isOpen,
  setOpen,
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

  const handleOpenChange = (val: boolean) => {
    if (setOpen) setOpen(val)
    if (onOpenChange) onOpenChange(val)
    if (!val && onClose) onClose()
  }

  const displayTitle = title || itemTitle || course?.title || item?.title || 'Item selecionado'
  const displayPrice = price ?? itemPrice ?? course?.price ?? item?.price ?? 0

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (isModalOpen) {
      setIsSuccess(false)
      setIsLoading(false)
    }
  }, [isModalOpen])

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
      setTimeout(() => {
        handleOpenChange(false)
      }, 2000)
    }, 1500)
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <DialogTitle className="text-2xl">Compra Aprovada!</DialogTitle>
            <p className="text-muted-foreground">
              Sua transação foi concluída com sucesso. Você já tem acesso ao conteúdo.
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
              <div className="mb-6 text-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-muted-foreground mb-1">Total a pagar</p>
                <p className="text-3xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    displayPrice,
                  )}
                </p>
              </div>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Impresso no Cartão</Label>
                  <Input required placeholder="JOÃO M SILVA" />
                </div>
                <div className="space-y-2">
                  <Label>Número do Cartão</Label>
                  <Input required placeholder="0000 0000 0000 0000" maxLength={19} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Validade (MM/AA)</Label>
                    <Input required placeholder="12/29" maxLength={5} />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input required placeholder="123" maxLength={4} type="password" />
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
                  Pagar Agora
                </Button>
              </form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
