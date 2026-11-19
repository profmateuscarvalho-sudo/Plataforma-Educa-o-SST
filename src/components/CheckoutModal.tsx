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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  CreditCard,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Zap,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { AvailableSlot } from '@/types'
import { formatCpf, sanitizeCpf, validateCpf } from '@/lib/cpf'
import { tokenizeCardDetailed } from '@/lib/ipag'
import { detectCardBrand } from '@/lib/card-brand'

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
  courseId?: string
  mentorshipId?: string
  selectedSlots?: AvailableSlot[]
  slotPrice?: number
}

type PayStep = 'idle' | 'tokenizing' | 'paying'

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
  courseId,
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
  const productType: 'course' | 'mentorship' = hasMentorship ? 'mentorship' : 'course'
  const productId = hasMentorship ? mentorshipId : courseId
  const baseDisplayPrice = price ?? itemPrice ?? course?.price ?? item?.price ?? 0
  const subtotal = hasMentorship ? (slotPrice || 0) * slotCount : baseDisplayPrice
  const discount = hasMentorship && slotCount >= 2 ? subtotal * 0.2 : 0
  const finalPrice = subtotal - discount

  const [payMethod, setPayMethod] = useState<'pix' | 'card'>('pix')
  const [step, setStep] = useState<PayStep>('idle')
  const [isSuccess, setIsSuccess] = useState(false)
  const [pixData, setPixData] = useState<{
    qrcode: string
    qrcode64?: string
    link?: string
  } | null>(null)
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null)
  const [cpfValue, setCpfValue] = useState('')
  const [cpfError, setCpfError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()

  useEffect(() => {
    if (isModalOpen) {
      setIsSuccess(false)
      setStep('idle')
      setPayMethod('pix')
      setPixData(null)
      setActivePaymentId(null)
      setCpfValue('')
      setCpfError(null)
    }
  }, [isModalOpen])

  // Polling Pix a cada 3s enquanto o QR Code está aberto — igual ao checkout de assinatura
  useEffect(() => {
    if (!isModalOpen || !pixData || !activePaymentId || isSuccess) return

    let isSubscribed = true

    const interval = setInterval(async () => {
      try {
        const paymentRecord = await pb.collection('payments').getOne(activePaymentId)
        if (!isSubscribed) return
        if (paymentRecord.status === 'paid') {
          clearInterval(interval)
          await refreshUser()
          setIsSuccess(true)
          toast({
            title: 'Pagamento Pix confirmado!',
            description: mentorshipId
              ? 'Sua mentoria foi confirmada! Você receberá um e-mail com o link de agendamento.'
              : 'Seu curso foi liberado. Bom estudo!',
          })
        }
      } catch {
        // Ignora erros transitórios no polling
      }
    }, 3000)

    return () => {
      isSubscribed = false
      clearInterval(interval)
    }
  }, [isModalOpen, pixData, activePaymentId, isSuccess, refreshUser, mentorshipId, toast])

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value)
    setCpfValue(formatted)
    if (cpfError) {
      const result = validateCpf(formatted)
      if (result.valid) setCpfError(null)
    }
  }

  const handleCpfBlur = () => {
    if (!cpfValue.trim()) {
      setCpfError('CPF é obrigatório.')
      return
    }
    const result = validateCpf(cpfValue)
    if (!result.valid) {
      setCpfError(result.error || 'CPF inválido.')
    } else {
      setCpfError(null)
    }
  }

  const buildPayload = (rawCpf: string) => {
    const cleanCpf = sanitizeCpf(rawCpf)
    const payload: Record<string, any> = {
      // amount é recalculado no servidor a partir do cadastro do curso/mentoria
      amount: finalPrice,
      type: payMethod,
      product_type: productType,
      customer: {
        name: user?.name || user?.email || '',
        cpf_cnpj: cleanCpf,
        email: user?.email,
        phone: user?.phone || '',
      },
    }
    if (productType === 'course' && courseId) {
      payload.course_id = courseId
    } else if (productType === 'mentorship' && mentorshipId) {
      payload.mentorship_id = mentorshipId
      if (hasMentorship) payload.selected_slots = slots
    }
    return payload
  }

  const handlePixPay = async (rawCpf: string) => {
    const payload = buildPayload(rawCpf)
    setStep('paying')
    try {
      const response = await pb.send('/backend/v1/create-payment', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })
      if (response && response.pix && response.payment_id) {
        setActivePaymentId(response.payment_id)
        setPixData(response.pix)
        toast({
          title: 'QR Code gerado!',
          description: 'Escaneie para pagar com Pix.',
        })
      } else {
        throw new Error('Falha ao gerar QR Code Pix.')
      }
    } catch (err: any) {
      toast({
        title: 'Erro do servidor',
        description:
          err?.message || 'Erro do servidor ao gerar o QR Code Pix. Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setStep('idle')
    }
  }

  const handleCardPay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const holder = String(formData.get('card_name') || '')
    const cardNumber = String(formData.get('card_number') || '').replace(/\D/g, '')
    const expiry = String(formData.get('expiry') || '')
    const cvv = String(formData.get('cvv') || '')
    const [expiryMonth, expiryYear] = expiry.split('/')
    const rawCpf = cpfValue || String(formData.get('cpf_cnpj') || '')

    const cpfValidation = validateCpf(rawCpf)
    if (!cpfValidation.valid) {
      const errorMessage =
        cpfValidation.error || 'CPF inválido. Verifique os números e tente novamente.'
      setCpfError(errorMessage)
      toast({ title: 'CPF inválido', description: errorMessage, variant: 'destructive' })
      return
    }
    setCpfError(null)

    // Tokenização 100% server-side via /backend/v1/ipag/tokenize-card.
    // Os dados brutos do cartão vão apenas ao endpoint de tokenização e não
    // são gravados em banco nem em log — apenas os 4 últimos dígitos voltam.
    setStep('tokenizing')
    let token = ''
    try {
      const result = await tokenizeCardDetailed({
        holder,
        number: cardNumber,
        expiryMonth: expiryMonth || '',
        expiryYear: expiryYear || '',
        cvv,
      })
      token = result.token
      if (!token) {
        throw new Error('Não foi possível validar o cartão. Verifique os dados e tente novamente.')
      }
    } catch (tokErr: any) {
      console.error('[checkout] falha de tokenização', {
        brand: detectCardBrand(cardNumber),
        last4: cardNumber.slice(-4),
        message: tokErr?.message || String(tokErr),
      })
      setStep('idle')
      toast({
        title: 'Erro ao validar cartão',
        description:
          tokErr?.message ||
          'Não foi possível validar o cartão. Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
      return
    }

    const payload = buildPayload(rawCpf)
    payload.card = {
      token,
      method: detectCardBrand(cardNumber),
      installments: 1,
    }

    setStep('paying')
    try {
      const response = await pb.send('/backend/v1/ipag/pay', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })
      if (response && response.status === 'approved') {
        await refreshUser()
        setIsSuccess(true)
        toast({ title: 'Pagamento processado com sucesso!' })
      } else {
        // Pagamento recusado pelo gateway/banco emissor
        toast({
          title: 'Pagamento recusado',
          description: 'Pagamento recusado, tente outro cartão.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      const refusalStatus = err?.status ?? err?.response?.status ?? err?.data?.code
      if (refusalStatus === 402) {
        // Razão real devolvida pelo iPag (repassada pelo hook)
        toast({
          title: 'Pagamento recusado',
          description: err?.message || 'Pagamento recusado, tente outro cartão.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro do servidor',
          description:
            err?.message ||
            'Erro do servidor ao processar o pagamento. Tente novamente em instantes.',
          variant: 'destructive',
        })
      }
    } finally {
      setStep('idle')
    }
  }

  const handleCopyPix = () => {
    if (pixData?.qrcode) {
      navigator.clipboard.writeText(pixData.qrcode)
      toast({ title: 'Código Pix copiado!' })
    }
  }

  // Um único form: despacha para Pix ou Cartão conforme a aba ativa
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (payMethod === 'pix') {
      e.preventDefault()
      const rawCpf = cpfValue || String(new FormData(e.currentTarget).get('cpf_cnpj') || '')
      const cpfValidation = validateCpf(rawCpf)
      if (!cpfValidation.valid) {
        const errorMessage =
          cpfValidation.error || 'CPF inválido. Verifique os números e tente novamente.'
        setCpfError(errorMessage)
        toast({ title: 'CPF inválido', description: errorMessage, variant: 'destructive' })
        return
      }
      setCpfError(null)
      handlePixPay(rawCpf)
    } else {
      handleCardPay(e)
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <DialogTitle className="text-2xl">Compra Aprovada!</DialogTitle>
            <p className="text-muted-foreground">
              {mentorshipId
                ? 'Sua mentoria foi confirmada! Você receberá um e-mail com o link de agendamento em instantes.'
                : 'Sua compra foi concluída com sucesso e o curso já está liberado.'}
            </p>
          </div>
        ) : pixData ? (
          <>
            <DialogHeader>
              <DialogTitle>Pagamento via Pix</DialogTitle>
              <DialogDescription>
                {displayTitle} · {formatCurrency(finalPrice)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-3 py-2">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                {pixData.qrcode64 ? (
                  <img
                    src={`data:image/png;base64,${pixData.qrcode64}`}
                    alt="QR Code Pix"
                    className="w-44 h-44"
                  />
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=${encodeURIComponent(pixData.qrcode)}`}
                    alt="QR Code Pix"
                    className="w-44 h-44"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center px-4">
                Escaneie o QR Code com seu app de banco para pagar
              </p>
              <Button variant="outline" onClick={handleCopyPix} className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Copiar código Pix
              </Button>
              <p className="text-xs text-slate-400 text-center flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Aguardando confirmação do pagamento...
              </p>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="w-full text-sm"
              >
                Fechar
              </Button>
            </div>
          </>
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
              {hasMentorship && (
                <div className="mb-4 space-y-1.5 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {slotCount}x Sessão ({formatCurrency(slotPrice || 0)})
                    </span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Desconto (20%)</span>
                      <span>- {formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                    <span>Total</span>
                    <span>{formatCurrency(finalPrice)}</span>
                  </div>
                </div>
              )}
              {!hasMentorship && (
                <div className="mb-6 text-center bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">Total a pagar</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(finalPrice)}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="checkout-avulso-cpf" className="text-xs">
                      CPF
                    </Label>
                    {cpfError && (
                      <span className="text-[11px] text-destructive font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {cpfError}
                      </span>
                    )}
                  </div>
                  <Input
                    id="checkout-avulso-cpf"
                    name="cpf_cnpj"
                    required
                    value={cpfValue}
                    onChange={handleCpfChange}
                    onBlur={handleCpfBlur}
                    placeholder="000.000.000-00"
                    className={cn(
                      'h-10 font-mono tracking-wide',
                      cpfError && 'border-destructive focus-visible:ring-destructive',
                    )}
                    maxLength={14}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>

                <Tabs value={payMethod} onValueChange={(v) => setPayMethod(v as 'pix' | 'card')}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="pix" className="text-sm">
                      <Zap className="w-4 h-4 mr-1.5" />
                      Pix
                    </TabsTrigger>
                    <TabsTrigger value="card" className="text-sm">
                      <CreditCard className="w-4 h-4 mr-1.5" />
                      Cartão
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pix" className="mt-3">
                    <div className="text-center py-3 px-2 bg-slate-50 rounded-lg">
                      <QrCode className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique em pagar para gerar o QR Code Pix instantaneamente.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="card" className="space-y-2.5 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nome do Titular</Label>
                      <Input
                        name="card_name"
                        required
                        placeholder="JOAO M SILVA"
                        className="h-10"
                        autoComplete="cc-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Número do Cartão</Label>
                      <Input
                        name="card_number"
                        required
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className="h-10"
                        autoComplete="cc-number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Validade (MM/AA)</Label>
                        <Input
                          name="expiry"
                          required
                          placeholder="12/29"
                          maxLength={5}
                          className="h-10"
                          autoComplete="cc-exp"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">CVV</Label>
                        <Input
                          name="cvv"
                          required
                          placeholder="123"
                          maxLength={4}
                          type="password"
                          className="h-10"
                          autoComplete="cc-csc"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg mt-2 shadow-lg shadow-primary/20"
                  disabled={step !== 'idle'}
                >
                  {step === 'tokenizing' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Validando cartão...
                    </>
                  ) : step === 'paying' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processando pagamento...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      Pagar de Forma Segura
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-slate-400">
                  <ShieldCheck className="inline w-3 h-3 mr-1" />
                  {payMethod === 'pix'
                    ? 'QR Code Pix gerado na hora via iPag.'
                    : 'Tokenização segura via iPag — seus dados de cartão não são armazenados'}
                </p>
              </form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
