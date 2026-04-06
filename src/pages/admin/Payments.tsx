import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { getPayments } from '@/services/payments'
import { Payment } from '@/types'
import { Badge } from '@/components/ui/badge'

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    getPayments().then(setPayments).catch(console.error)
  }, [])

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-serif font-bold text-secondary">Pagamentos IPAG</h2>
      <Card>
        <CardContent className="p-0 divide-y">
          <div className="grid grid-cols-5 p-4 font-bold text-sm bg-slate-50 text-slate-600">
            <div>Data</div>
            <div>Usuário</div>
            <div>Produto</div>
            <div>Valor</div>
            <div>Status</div>
          </div>
          {payments.map((p) => (
            <div key={p.id} className="grid grid-cols-5 p-4 items-center text-sm hover:bg-slate-50">
              <div className="text-slate-500">{new Date(p.created).toLocaleDateString()}</div>
              <div className="font-medium">{p.expand?.user?.name || p.user}</div>
              <div>{p.product_type || '-'}</div>
              <div className="font-bold text-emerald-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  p.amount,
                )}
              </div>
              <div>
                <Badge
                  variant={
                    p.status === 'paid'
                      ? 'default'
                      : p.status === 'pending'
                        ? 'outline'
                        : 'destructive'
                  }
                  className={
                    p.status === 'paid'
                      ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white'
                      : ''
                  }
                >
                  {p.status}
                </Badge>
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="p-8 text-center text-slate-500">Nenhum pagamento registrado.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
