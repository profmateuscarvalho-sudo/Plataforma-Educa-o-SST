import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { getPayments } from '@/services/payments'
import { Payment } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const PAGE_SIZE = 50

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    getPayments(page, PAGE_SIZE)
      .then((res) => {
        setPayments(res.items)
        setTotalItems(res.totalItems)
        setTotalPages(Math.max(1, Math.ceil(res.totalItems / PAGE_SIZE)))
      })
      .catch(console.error)
  }, [page])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-3xl font-serif font-bold text-secondary">Pagamentos IPAG</h2>
        <span className="text-sm text-slate-500">
          Página {page} de {totalPages} — {totalItems} pagamentos
        </span>
      </div>
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
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Próxima
        </Button>
      </div>
    </div>
  )
}
