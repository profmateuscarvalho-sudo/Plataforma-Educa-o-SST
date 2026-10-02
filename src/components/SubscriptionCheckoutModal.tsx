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
import { CreditCard, Loader2, CheckCircle2, Copy, QrCode, ShieldCheck, Zap } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { createSubscription } from '@/services/subscriptions'
import { createPayment } from '@/services/payments'
import { SubscriptionPlan } from '@/types'
import { cn } from '@/lib/utils'
import { loadIpagScript, tokenizeCard } from '@/lib/ipag'

export function SubscriptionCheckoutModal({
  isOpen,
  setIsOpen,
  plan,
}: {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  plan: SubscriptionPlan | null
}) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
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
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()

  useEffect(() => {
    if (isOpen && plan) {
      setIsSuccess(false)
      setStep('idle')
      setActivePaymentId(null)
      setPixData(null)
      setBillingCycle(plan.interval === 'yearly' ? 'yearly' : 'monthly')
      setPaymentMethod('pix')
      setInstallments(1)
      // Pre-load the iPag tokenizer script so it is ready when the user submits
      loadIpagScript().catch(() => {
        // Silent background preload fail — will retry on submit
      })
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
      } catch (err) {
        // Ignora erros transitórios no polling
      }
    }, 3000)

    return () => {
      isSubscribed = false
      clearInterval(interval)
    }
  }, [isOpen, pixData, activePaymentId, isSuccess, refreshUser, setIsOpen, toast])

  if (!plan) return null

  const monthlyPrice = plan.price ?? 0
  const yearlyPrice = plan.price_yearly || Math.round(monthlyPrice * 12 * 0.83 * 100) / 100
  const currentPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice
  const displayName = `${plan.name} ${billingCycle === 'monthly' ? 'Mensal' : 'Anual'}`
  const description =
    billingCycle === 'monthly' ? 'Cobrança recorrente' : 'Cobrança única, 1x por ano'
  const savings = monthlyPrice * 12 - yearlyPrice

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const detectCardBrand = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '')

    // Faixas Elo conhecidas (incluindo as que começam com 4)
    const eloPrefixes = [
      '4011',
      '431274',
      '438935',
      '451416',
      '457393',
      '4576',
      '504175',
      '5067',
      '509',
      '627780',
      '636297',
      '636368',
      '650',
      '6516',
      '6550',
    ]

    let detectedBrand = 'visa'
    if (
      eloPrefixes.some((prefix) => cleanNumber.startsWith(prefix)) ||
      cleanNumber.startsWith('6')
    ) {
      detectedBrand = 'elo'
    } else if (cleanNumber.startsWith('4')) {
      detectedBrand = 'visa'
    } else if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) {
      detectedBrand = 'mastercard'
    } else if (cleanNumber.startsWith('3')) {
      detectedBrand = 'amex'
    } else {
      detectedBrand = 'visa'
    }

    // TODO: remover debug
    console.log('[DEBUG Bandeira iPag]', { input: number, cleanNumber, detectedBrand })

    return detectedBrand
  }

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!plan || !user) return

    const formData = new FormData(e.currentTarget)
    const cpfCnpj = (formData.get('cpf_cnpj') as string) || ''

    const payload: Record<string, any> = {
      amount: currentPrice,
      type: paymentMethod,
      product_type: 'subscription',
      plan_id: plan.id,
      billing_cycle: billingCycle,
      customer: {
        name: user.name || user.email,
        cpf_cnpj: cpfCnpj,
        email: user.email,
        phone: user.phone || '',
      },
    }

    if (paymentMethod === 'card') {
      setStep('tokenizing')

      const cardNumber = (formData.get('card_number') as string) || ''
      const expiry = (formData.get('expiry') as string) || ''
      const [rawMonth, rawYear] = expiry.split('/')
      const holder = (formData.get('card_name') as string) || ''
      const cvv = (formData.get('cvv') as string) || ''
      const method = detectCardBrand(cardNumber)

      let token: string | null = null
      try {
        token = await tokenizeCard({
          holder,
          number: cardNumber,
          expiryMonth: rawMonth || '',
          expiryYear: rawYear || '',
          cvv,
        })
        if (!token) {
          throw new Error('Sem token retornado')
        }
      } catch {
        setStep('idle')
        toast({
          title: 'Erro ao validar cartão',
          description: 'Não foi possível validar o cartão. Verifique os dados e tente novamente.',
          variant: 'destructive',
        })
        return
      }

      payload.card = {
        token,
        method,
        installments: billingCycle === 'yearly' ? installments : 1,
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
      const response = await createPayment(payload as any)

      if (paymentMethod === 'pix') {
        if (response.pix && response.payment_id) {
          setActivePaymentId(response.payment_id)
          setPixData(response.pix)
          toast({
            title: 'QR Code gerado!',
            description: 'Escaneie para pagar com Pix.',
          })
        } else {
          setStep('idle')
          throw new Error('Falha ao gerar QR Code Pix.')
        }
      } else {
        if (response.status === 'paid') {
          setIsSuccess(true)
          toast({ title: 'Assinatura ativada com sucesso!' })
          await refreshUser()
          setTimeout(() => setIsOpen(false), 3000)
        } else {
          // Pagamento recusado pelo gateway/banco: volta imediatamente para idle,
          // mantém os dados digitados e avisa o usuário para tentar outro cartão
          setStep('idle')
          toast({
            title: 'Pagamento recusado',
            description: 'Pagamento recusado, tente outro cartão.',
            variant: 'destructive',
          })
          return
        }
      }
    } catch (err: any) {
      setStep('idle')
      toast({
        title: 'Erro ao processar pagamento',
        description: err?.message || 'Pagamento recusado, tente outro cartão.',
        variant: 'destructive',
      })
      return
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

            {/* Billing Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1 mt-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'flex-1 py-2 text-sm font-medium rounded-md transition-all',
                  billingCycle === 'monthly'
                    ? 'bg-white shadow-sm text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  'flex-1 py-2 text-sm font-medium rounded-md transition-all relative',
                  billingCycle === 'yearly'
                    ? 'bg-white shadow-sm text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                Anual
                {billingCycle === 'yearly' && (
                  <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    -17%
                  </span>
                )}
              </button>
            </div>

            {/* Plan Summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">{displayName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{formatCurrency(currentPrice)}</p>
                  <p className="text-xs text-slate-400">
                    {billingCycle === 'monthly'
                      ? 'por mês'
                      : `economia de ${formatCurrency(savings)}`}
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
                  <Label className="text-xs">CPF</Label>
                  <Input
                    name="cpf_cnpj"
                    required
                    placeholder="000.000.000-00"
                    className="h-10"
                    maxLength={18}
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
                        />
                      </div>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Parcelamento</Label>
                        <Select
                          value={String(installments)}
                          onValueChange={(v) => setInstallments(Number(v))}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
                              const installmentValue = yearlyPrice / n
                              return (
                                <SelectItem key={n} value={String(n)}>
                                  {n === 1
                                    ? `1x de ${formatCurrency(installmentValue)} (à vista)`
                                    : `${n}x de ${formatCurrency(installmentValue)}`}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <Button type="submit" className="w-full h-11 text-base" disabled={step !== 'idle'}>
                  {step === 'tokenizing' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Conectando com segurança...
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
