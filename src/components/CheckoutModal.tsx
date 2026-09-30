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
import { AvailableSlot } from '@/types'
import { loadIpagScript } from '@/lib/ipag'

interface CheckoutModalProps {
  open?: boolean
  isOpen?: boolean
  setOpen?: (v: boolean) => void
  setIsOpen?: (v: boolean) => void
  onOpenChange?: (v: boolean) => void
  onClose?: () => void
  title?: string
  itemTitle?: string
  course?: any
  item?: any
  price?: number
  itemPrice?: number
  mentorshipId?: string
  selectedSlots?: AvailableSlot[]
  slotPrice?: number
}

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
  mentorshipId,
  selectedSlots,
  slotPrice,
}: CheckoutModalProps) {
  const isModalOpen = open !== undefined ? open : isOpen || false
  const handleOpen = setIsOpen || setOpen

  const handleOpenChange = (val: boolean) => {
    if (handleOpen) handleOpen(val)
    if (onOpenChange) onOpenChange(val)
    if (!val && onClose) onClose()
  }

  const displayTitle = title || itemTitle || course?.title || item?.title || 'Item selecionado'
  const slots = selectedSlots || []
  const slotCount = slots.length
  const hasMentorship = !!mentorshipId && slotCount > 0
  const baseDisplayPrice = price ?? itemPrice ?? course?.price ?? item?.price ?? 0
  const subtotal = hasMentorship ? (slotPrice || 0) * slotCount : baseDisplayPrice
  const discount = hasMentorship && slotCount >= 2 ? subtotal * 0.2 : 0
  const finalPrice = subtotal - discount

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isModalOpen) {
      setIsSuccess(false)
      setIsLoading(false)
      loadIpagScript().catch(() => {})
    }
  }, [isModalOpen])

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const payload: Record<string, any> = {
      amount: finalPrice,
      item: displayTitle,
      card_name: formData.get('card_name'),
      card_number: formData.get('card_number'),
      expiry: formData.get('expiry'),
      cvv: formData.get('cvv'),
      product_type: mentorshipId ? 'mentorship' : 'course',
    }
    if (mentorshipId) payload.mentorship_id = mentorshipId
    if (hasMentorship) payload.selected_slots = slots

    try {
      const response = await pb.send('/backend/v1/ipag/pay', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })
      if (response && response.status === 'approved') {
        setIsSuccess(true)
        toast({ title: 'Pagamento processado com sucesso!' })
        setTimeout(() => handleOpenChange(false), 3000)
      } else {
        throw new Error('Falha no processamento.')
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao processar pagamento',
        description: err?.message || 'Verifique os dados do cartao e tente novamente.',
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
              {mentorshipId
                ? 'Sua mentoria foi confirmada! Voce recebera um email com o link de acesso em instantes.'
                : 'Sua transacao foi concluida com sucesso via iPag.'}
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Finalizar Compra</DialogTitle>
              <DialogDescription>
                Voce esta adquirindo:{' '}
                <span className="font-semibold text-foreground">{displayTitle}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {hasMentorship && (
                <div className="mb-4 space-y-1.5 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {slotCount}x Sessao (
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(slotPrice || 0)}
                      )
                    </span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(subtotal)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Desconto (20%)</span>
                      <span>
                        -{' '}
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                    <span>Total</span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(finalPrice)}
                    </span>
                  </div>
                </div>
              )}
              {!hasMentorship && (
                <div className="mb-6 text-center bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">Total a pagar</p>
                  <p className="text-3xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      finalPrice,
                    )}
                  </p>
                </div>
              )}
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Impresso no Cartao</Label>
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
                <p className="text-xs text-center text-slate-400 mt-4">
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
