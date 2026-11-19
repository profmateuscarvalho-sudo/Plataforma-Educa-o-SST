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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CreditCard,
  Loader2,
  CheckCircle2,
  Copy,
  QrCode,
  ShieldCheck,
  Zap,
  AlertCircle,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { createSubscription } from '@/services/subscriptions'
import { createPayment, type CreatePaymentPayload } from '@/services/payments'
import { SubscriptionPlan } from '@/types'
import { cn } from '@/lib/utils'
import { calcularPrecosDePlano, formatBRL, round2 } from '@/lib/pricing'
import { tokenizeCardDetailed } from '@/lib/ipag'
import { detectCardBrand } from '@/lib/card-brand'
import { formatCpf, sanitizeCpf, validateCpf } from '@/lib/cpf'

export function SubscriptionCheckoutModal({
  isOpen,
  setIsOpen,
  plan,
}: {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  plan: SubscriptionPlan | null
}) {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix')
  const [installments, setInstallments] = useState(1)
  const [step, setStep] = useState<'idle' | 'tokenizing' | 'paying'>('idle')
  const [isSuccess, setIsSuccess] = useState(false)
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null)
  const [pixData, setPixData] = useState<{
    qrcode: string
    qrcode64?: string
    link?: string
  } | null>(null)
  const [cpfValue, setCpfValue] = useState('')
  const [cpfError, setCpfError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()

  useEffect(() => {
    if (isOpen && plan) {
      setIsSuccess(false)
      setStep('idle')
      setActivePaymentId(null)
      setPixData(null)
      setCpfError(null)
      setPaymentMethod('pix')
      setInstallments(1)
    }
  }, [isOpen, plan])

  // Polling Pix a cada 3s enquanto pixData e activePaymentId estiverem ativos
  useEffect(() => {
    if (!isOpen || !pixData || !activePaymentId || isSuccess) return

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
            description: 'Sua assinatura foi ativada com sucesso.',
          })
          setTimeout(() => {
            if (isSubscribed) setIsOpen(false)
          }, 3000)
        }
      } catch {
        // Ignora erros transitórios no polling
      }
    }, 3000)

    return () => {
      isSubscribed = false
      clearInterval(interval)
    }
  }, [isOpen, pixData, activePaymentId, isSuccess, refreshUser, setIsOpen, toast])

  if (!plan) return null

  // Assinatura é SEMPRE anual (Bloco 2): sem seletor de ciclo.
  // Valores vêm de src/lib/pricing.ts (mesma lógica validada no backend).
  const pricing = calcularPrecosDePlano(plan)
  const cardTotal = pricing.yearlyCardTotal
  const pixTotal = pricing.yearlyPixTotal
  const displayName = plan.name
  const description = 'Assinatura anual — 12x sem juros no cartão ou Pix à vista (-20%)'

  const formatCurrency = formatBRL

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value)
    setCpfValue(formatted)
    if (cpfError) {
      const result = validateCpf(formatted)
      if (result.valid) {
        setCpfError(null)
      }
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

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!plan || !user) return

    const formData = new FormData(e.currentTarget)
    const rawCpf = cpfValue || (formData.get('cpf_cnpj') as string) || ''

    // Validação estrita do CPF com dígitos verificadores (módulo 11)
    const cpfValidation = validateCpf(rawCpf)
    if (!cpfValidation.valid) {
      const errorMessage =
        cpfValidation.error || 'CPF inválido. Verifique os números e tente novamente.'
      setCpfError(errorMessage)
      toast({
        title: 'CPF inválido',
        description: errorMessage,
        variant: 'destructive',
      })
      return
    }
    setCpfError(null)

    // Sanitiza garantindo exatamente 11 dígitos numéricos limpos
    const cleanCpf = sanitizeCpf(rawCpf)

    // SEGURANÇA: o frontend NÃO envia amount — o backend busca o plano,
    // aplica a mesma função de cálculo (com a promoção vigente) e define o valor.
    const payload: CreatePaymentPayload = {
      type: paymentMethod,
      product_type: 'subscription',
      plan_id: plan.id,
      billing_cycle: 'yearly',
      installments: paymentMethod === 'card' ? installments : 1,
      customer: {
        name: user.name || user.email || '',
        cpf_cnpj: cleanCpf,
        email: user.email,
        phone: user.phone || '',
      },
    }

    if (paymentMethod === 'card') {
      setStep('tokenizing')

      const cardNumber = ((formData.get('card_number') as string) || '').replace(/\D/g, '')
      const expiry = (formData.get('expiry') as string) || ''
      const [rawMonth, rawYear] = expiry.split('/')
      const holder = (formData.get('card_name') as string) || ''
      const cvv = (formData.get('cvv') as string) || ''
      const method = detectCardBrand(cardNumber)

      // Tokenização 100% server-side: os dados brutos do cartão vão apenas
      // para POST /backend/v1/ipag/tokenize-card (que chama o iPag) e não são
      // gravados em banco nem em log — apenas os 4 últimos dígitos voltam.
      let tokenResult: { token: string; brand?: string; last4?: string } | null = null
      try {
        tokenResult = await tokenizeCardDetailed({
          holder,
          number: cardNumber,
          expiryMonth: rawMonth || '',
          expiryYear: rawYear || '',
          cvv,
        })
        if (!tokenResult.token) {
          throw new Error(
            'Não foi possível validar o cartão. Verifique os dados e tente novamente.',
          )
        }
      } catch (tokErr: any) {
        // Log apenas de metadados não sensíveis (bandeira/últimos 4 dígitos)
        console.error('[checkout] falha de tokenização', {
          brand: method,
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

      payload.card = {
        token: tokenResult.token,
        method,
        installments,
      }

      setStep('paying')
    } else {
      setStep('paying')
    }

    try {
      await createSubscription(user.id, plan.id)
    } catch {
      // Best effort — proceed with payment regardless
    }

    try {
      const response = await createPayment(payload)

      if (paymentMethod === 'pix') {
        if (response.pix && response.payment_id) {
          setActivePaymentId(response.payment_id)
          setPixData(response.pix)
          toast({
            title: 'QR Code gerado!',
            description: 'Escaneie para pagar com Pix.',
          })
        } else {
          throw new Error('Falha ao gerar QR Code Pix.')
        }
      } else {
        if (response.status === 'paid') {
          setIsSuccess(true)
          toast({ title: 'Assinatura ativada com sucesso!' })
          await refreshUser()
          setTimeout(() => setIsOpen(false), 3000)
        } else {
          // Pagamento recusado pelo gateway/banco emissor
          toast({
            title: 'Pagamento recusado',
            description: 'Pagamento recusado, tente outro cartão.',
            variant: 'destructive',
          })
          return
        }
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[440px]">
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
              <DialogTitle className="text-xl">Assinar {plan.name}</DialogTitle>
              <DialogDescription>Pagamento via iPag · ambiente seguro</DialogDescription>
            </DialogHeader>

            {/* Plan Summary — assinatura anual (sem seletor de ciclo) */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">{displayName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{formatCurrency(cardTotal)}</p>
                  <p className="text-xs text-slate-400">
                    12x de {formatCurrency(pricing.installment)} sem juros
                  </p>
                </div>
              </div>
            </div>

            {pixData ? (
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
                <p className="text-xs text-slate-400 text-center">
                  Após o pagamento, sua assinatura será ativada automaticamente.
                </p>
                <Button variant="ghost" onClick={() => setIsOpen(false)} className="w-full text-sm">
                  Fechar
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePayment} className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="checkout-cpf" className="text-xs">
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
                    id="checkout-cpf"
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

                <Tabs
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as 'pix' | 'card')}
                >
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
                      <p className="mt-2 text-lg font-bold text-emerald-600">
                        {formatCurrency(pixTotal)} à vista
                      </p>
                      <p className="text-xs text-slate-400">20% de desconto no Pix</p>
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
                    <div className="space-y-1.5">
                      <Label className="text-xs">Parcelamento (sem juros)</Label>
                      <Select
                        value={String(installments)}
                        onValueChange={(v) => setInstallments(Number(v))}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
                            const installmentValue = Math.round((cardTotal / n) * 100) / 100
                            return (
                              <SelectItem key={n} value={String(n)}>
                                {n === 1
                                  ? `1x de ${formatCurrency(installmentValue)} (à vista)`
                                  : `${n}x de ${formatCurrency(installmentValue)} — total ${formatCurrency(cardTotal)}`}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button type="submit" className="w-full h-11 text-base" disabled={step !== 'idle'}>
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
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Pagar de forma segura
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-slate-400">
                  Seus dados são criptografados e processados diretamente pelo iPag.
                </p>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
