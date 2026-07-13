import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Send, CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

const STATUS_MAP: Record<string, string> = {
  pago: 'APPROVED',
  falhou: 'REFUSED',
  pendente: 'PRE-AUTHORIZED',
}

interface WebhookResult {
  success: boolean
  status: number
  data: any
}

export function WebhookSimulator() {
  const { toast } = useToast()
  const [paymentId, setPaymentId] = useState('')
  const [status, setStatus] = useState('pago')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<WebhookResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const payload = {
      id: 999999,
      uuid: 'teste-simulado-manual',
      resource: 'transactions',
      attributes: {
        order_id: paymentId,
        amount: 10.0,
        status: {
          code: 6,
          message: STATUS_MAP[status],
        },
      },
    }

    try {
      const data = await pb.send('/backend/v1/ipag-webhook', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })
      setResult({ success: true, status: 200, data })
      toast({ title: 'Webhook enviado', description: 'Simulação concluída' })
    } catch (err: any) {
      const httpStatus = err?.status || 0
      const errorData: any = err?.response?.data || err?.response || err?.message || String(err)
      setResult({ success: false, status: httpStatus, data: errorData })
      toast({
        title: 'Erro na requisição',
        description: `HTTP ${httpStatus || 'N/A'}`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simular Webhook do iPag</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="payment_id">payment_id</Label>
            <Input
              id="payment_id"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              required
              placeholder="ID do registro em payments"
            />
          </div>

          <div className="space-y-2">
            <Label>Status do Pagamento</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="falhou">Falhou</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Simular Notificação
              </>
            )}
          </Button>
        </form>

        {result && (
          <div className="space-y-4 animate-fade-in mt-6">
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
                  ? 'Webhook processado com sucesso.'
                  : 'Verifique o JSON de erro abaixo para mais detalhes.'}
              </AlertDescription>
            </Alert>

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
      </CardContent>
    </Card>
  )
}
