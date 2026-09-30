import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  QrCode,
  Copy,
  ExternalLink,
  Check,
  CreditCard,
  KeyRound,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createPayment, type CreatePaymentPayload } from '@/services/payments'
import { WebhookSimulator } from '@/components/admin/WebhookSimulator'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { ShieldAlert } from 'lucide-react'
import { BACKEND_URL } from '@/lib/constants'
import { tokenizeCard, IPAG_API_ID, IS_IPAG_SANDBOX } from '@/lib/ipag'

const CARD_BRANDS = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'elo', label: 'Elo' },
  { value: 'amex', label: 'American Express' },
  { value: 'hipercard', label: 'Hipercard' },
  { value: 'diners', label: 'Diners Club' },
  { value: 'discover', label: 'Discover' },
  { value: 'jcb', label: 'JCB' },
  { value: 'aura', label: 'Aura' },
]

interface TestResult {
  success: boolean
  status: number
  data: any
}

export default function AdminTestes() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [paymentType, setPaymentType] = useState<'pix' | 'card'>('pix')
  const [amount, setAmount] = useState('10.00')
  const [customerName, setCustomerName] = useState('João da Silva Teste')
  const [cpfCnpj, setCpfCnpj] = useState('12345678909')
  const [copied, setCopied] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [cardExpiryMonth, setCardExpiryMonth] = useState('')
  const [cardExpiryYear, setCardExpiryYear] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardBrand, setCardBrand] = useState('')
  const [useTokenization, setUseTokenization] = useState(true)
  const [, setGeneratedToken] = useState<string | null>(null)
  const { user } = useAuth()
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityResult, setSecurityResult] = useState<TestResult | null>(null)

  const handleSecurityTest = async () => {
    if (!user) {
      toast({ title: 'Usuário não autenticado', variant: 'destructive' })
      return
    }
    setSecurityLoading(true)
    setSecurityResult(null)

    const payload = {
      user: user.id,
      amount: 999,
      status: 'paid',
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/collections/payments/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token || '',
        },
        body: JSON.stringify(payload),
      })

      let data: any = null
      try {
        data = await response.json()
      } catch {
        data = await response.text().catch(() => null)
      }

      setSecurityResult({ success: response.status === 403, status: response.status, data })
      toast({
        title: response.status === 403 ? 'Bloqueio confirmado' : 'Resposta inesperada',
        description: `HTTP ${response.status}`,
        variant: response.status === 403 ? 'default' : 'destructive',
      })
    } catch (err: any) {
      setSecurityResult({ success: false, status: 0, data: String(err?.message || err) })
      toast({
        title: 'Erro de rede',
        description: String(err?.message || err),
        variant: 'destructive',
      })
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const payload: CreatePaymentPayload = {
      type: paymentType,
      amount: parseFloat(amount),
      customer: { name: customerName, cpf_cnpj: cpfCnpj },
    }

    if (paymentType === 'card') {
      if (useTokenization) {
        try {
          const token = await tokenizeCard({
            holder: cardHolder,
            number: cardNumber,
            expiryMonth: cardExpiryMonth,
            expiryYear: cardExpiryYear,
            cvv: cardCvv,
          })
          setGeneratedToken(token)
          payload.card = {
            method: cardBrand,
            token,
          }
        } catch (tokErr: any) {
          setLoading(false)
          setResult({
            success: false,
            status: 0,
            data: { error: 'Falha na tokenização no navegador', details: tokErr?.message },
          })
          toast({
            title: 'Erro na tokenização',
            description: tokErr?.message || 'Falha ao gerar token do cartão',
            variant: 'destructive',
          })
          return
        }
      } else {
        setGeneratedToken(null)
        payload.card = {
          method: cardBrand,
          holder: cardHolder,
          number: cardNumber,
          expiry_month: cardExpiryMonth,
          expiry_year: cardExpiryYear,
          cvv: cardCvv,
        }
      }
    } else {
      setGeneratedToken(null)
    }

    try {
      const data = await createPayment(payload)
      setResult({ success: true, status: 200, data })
      toast({ title: 'Pagamento processado', description: `Status: ${data.status}` })
    } catch (err: any) {
      const status = err?.status || 0
      let errorData: any = err?.response?.data || err?.response || err?.message || String(err)
      setResult({ success: false, status, data: errorData })
      toast({
        title: 'Erro na requisição',
        description: `HTTP ${status || 'N/A'}`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const pixQrCode = result?.success ? result.data?.pix?.qrcode : null
  const pixLink = result?.success ? result.data?.pix?.link : null

  const handleCopyPixCode = () => {
    if (!pixQrCode) return
    navigator.clipboard.writeText(pixQrCode)
    setCopied(true)
    toast({ title: 'Código Pix copiado!' })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-serif font-bold text-secondary">Testes de Integração iPag</h2>
        <p className="text-slate-500 mt-2">
          Dispare pagamentos de teste diretamente contra o endpoint{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">
            /backend/v1/create-payment
          </code>{' '}
          para validar a comunicação com o gateway.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulário de Pagamento de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <Label>Tipo de Transação</Label>
              <RadioGroup
                value={paymentType}
                onValueChange={(v) => setPaymentType(v as 'pix' | 'card')}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="cursor-pointer font-normal">
                    Pix
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="cursor-pointer font-normal">
                    Cartão
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="10.00"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nome do Cliente</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="João da Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  required
                  placeholder="12345678909"
                />
              </div>
            </div>

            {paymentType === 'card' && (
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CreditCard className="w-4 h-4" />
                    Dados do Cartão
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useTokenization}
                      onChange={(e) => setUseTokenization(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <span>Tokenizar no cliente (iPag.js)</span>
                  </label>
                </div>
                {useTokenization && (
                  <div className="text-xs bg-blue-50 text-blue-700 p-2.5 rounded border border-blue-100 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 shrink-0" />
                    <span>
                      Ambiente: <strong>{IS_IPAG_SANDBOX ? 'Sandbox' : 'Produção'}</strong> · ID
                      iPag: <code>{IPAG_API_ID || '(não definido)'}</code>
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                    placeholder="4111111111111111"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardHolder">Nome do Titular</Label>
                  <Input
                    id="cardHolder"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    required
                    placeholder="JOÃO DA SILVA"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiryMonth">Mês de Validade</Label>
                    <Input
                      id="cardExpiryMonth"
                      value={cardExpiryMonth}
                      onChange={(e) => setCardExpiryMonth(e.target.value)}
                      required
                      placeholder="12"
                      inputMode="numeric"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiryYear">Ano de Validade</Label>
                    <Input
                      id="cardExpiryYear"
                      value={cardExpiryYear}
                      onChange={(e) => setCardExpiryYear(e.target.value)}
                      required
                      placeholder="2030"
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardCvv">CVV</Label>
                    <Input
                      id="cardCvv"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      required
                      placeholder="123"
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardBrand">Bandeira</Label>
                  <Select value={cardBrand} onValueChange={setCardBrand}>
                    <SelectTrigger id="cardBrand">
                      <SelectValue placeholder="Selecione a bandeira" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_BRANDS.map((brand) => (
                        <SelectItem key={brand.value} value={brand.value}>
                          {brand.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Simular Pagamento
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4 animate-fade-in">
          <Alert
            className={
              result.success
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                : 'border-red-500 bg-red-50 text-red-800'
            }
          >
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle>
              {result.success
                ? `Requisição concluída (HTTP ${result.status})`
                : `Falha na requisição (HTTP ${result.status || 'N/A'})`}
            </AlertTitle>
            <AlertDescription>
              {result.success
                ? `Status do pagamento: ${result.data?.status || 'N/A'}`
                : 'Verifique o JSON de erro abaixo para mais detalhes.'}
            </AlertDescription>
          </Alert>

          {pixQrCode && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <QrCode className="w-5 h-5 text-primary" />
                  QR Code Pix
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixQrCode)}`}
                  alt="QR Code Pix"
                  className="border-2 border-slate-200 rounded-lg"
                  width={220}
                  height={220}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleCopyPixCode}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-emerald-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar código Pix
                    </>
                  )}
                </Button>
                {pixLink && (
                  <div className="w-full space-y-2">
                    <Label className="text-xs text-slate-500">
                      Página de pagamento alternativa
                    </Label>
                    <a
                      href={pixLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir página de pagamento iPag
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resposta JSON (Raw)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto text-xs font-mono max-h-96">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-amber-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            Validação de Segurança — Bloqueio de Criação Direta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Este teste envia uma requisição{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">POST</code> diretamente ao
            endpoint padrão do PocketBase{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
              /api/collections/payments/records
            </code>{' '}
            utilizando o token do usuário atualmente autenticado. Como as regras de segurança foram
            atualizadas para bloquear a criação direta, o resultado esperado é um erro{' '}
            <span className="font-semibold text-amber-700">403 Forbidden</span>.
          </p>
          <Button
            type="button"
            variant="outline"
            className="border-amber-400 text-amber-700 hover:bg-amber-50"
            onClick={handleSecurityTest}
            disabled={securityLoading}
          >
            {securityLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 mr-2" />
                Testar bloqueio de criação direta
              </>
            )}
          </Button>

          {securityResult && (
            <div className="space-y-4 animate-fade-in">
              <Alert
                className={
                  securityResult.status === 403
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-red-500 bg-red-50 text-red-800'
                }
              >
                {securityResult.status === 403 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertTitle>
                  HTTP {securityResult.status || 'N/A'} —{' '}
                  {securityResult.status === 403
                    ? 'Segurança ativa: criação direta bloqueada'
                    : 'Resultado inesperado — verifique a resposta abaixo'}
                </AlertTitle>
                <AlertDescription>
                  {securityResult.status === 403
                    ? 'O servidor recusou a criação direta do registro de pagamento, confirmando que as regras de segurança estão funcionando corretamente.'
                    : 'O servidor não retornou 403. Verifique se as regras de segurança foram aplicadas corretamente.'}
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resposta JSON (Raw)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto text-xs font-mono max-h-96">
                    {JSON.stringify(securityResult.data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <WebhookSimulator />
    </div>
  )
}
