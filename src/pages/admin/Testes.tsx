import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  QrCode,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createPayment, type CreatePaymentPayload } from '@/services/payments'
import { WebhookSimulator } from '@/components/admin/WebhookSimulator'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const payload: CreatePaymentPayload = {
      type: paymentType,
      amount: parseFloat(amount),
      customer: { name: customerName, cpf_cnpj: cpfCnpj },
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

      <WebhookSimulator />
    </div>
  )
}
