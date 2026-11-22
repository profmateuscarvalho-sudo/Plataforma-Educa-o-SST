// Painel lateral de detalhe de uma venda — aberto ao clicar numa linha da
// tabela da aba Vendas (/admin/vendas). Mostra os dados completos do
// pagamento, o histórico de e-mails (email_logs) e os botões:
//  - "Reenviar e-mail de confirmação" — funcional (POST server-side)
//  - "Cancelar / estornar" — APENAS botão por enquanto (fluxo na Parte B)
import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, Ban, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getVendaDetalhe, reenviarEmailConfirmacao } from '@/services/admin-vendas'
import type { VendaItem, VendasEmailLog } from '@/services/admin-vendas'

interface VendaDetailSheetProps {
  venda: VendaItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Pago', cls: 'bg-emerald-500 text-white border-transparent hover:bg-emerald-600' },
  pending: { label: 'Pendente', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  failed: { label: 'Recusado', cls: 'bg-rose-100 text-rose-800 border-rose-300' },
}

const TIPO_EMAIL: Record<string, string> = {
  payment_confirmed: 'Confirmação de pagamento',
  activation_paid: 'Ativação (pago)',
  activation_free: 'Ativação (gratuito)',
  lead: 'Lead',
  upgrade: 'Upgrade de plano',
  password_reset: 'Redefinição de senha',
  brevo_sync: 'Sincronização Brevo',
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{rotulo}</span>
      <span className="font-medium text-right break-words">{valor || '—'}</span>
    </div>
  )
}

export default function VendaDetailSheet({ venda, open, onOpenChange }: VendaDetailSheetProps) {
  const [detalhe, setDetalhe] = useState<VendaItem | null>(null)
  const [emails, setEmails] = useState<VendasEmailLog[]>([])
  const [loading, setLoading] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open || !venda) return
    let cancelado = false
    setLoading(true)
    getVendaDetalhe(venda.id)
      .then((res) => {
        if (cancelado) return
        setDetalhe(res.item || null)
        setEmails(res.emails || [])
      })
      .catch((err) => {
        console.error(err)
        toast({
          title: 'Erro ao carregar o detalhe da venda',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [open, venda, toast])

  const handleReenviar = async () => {
    if (!detalhe) return
    setReenviando(true)
    try {
      await reenviarEmailConfirmacao(detalhe.id)
      toast({
        title: 'E-mail reenviado',
        description: `Confirmação enviada para ${detalhe.email}.`,
      })
      // Atualiza o histórico de e-mails após o reenvio
      const res = await getVendaDetalhe(detalhe.id)
      setDetalhe(res.item || null)
      setEmails(res.emails || [])
    } catch (err) {
      toast({
        title: 'Erro ao reenviar o e-mail',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setReenviando(false)
    }
  }

  const v = detalhe || venda
  if (!v) return null
  const status = STATUS_META[v.status] || { label: v.status, cls: '' }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-6">
        <SheetHeader className="p-0">
          <SheetTitle className="flex items-center gap-2">
            Venda {v.id.slice(0, 8)}
            <Badge className={status.cls}>{status.label}</Badge>
          </SheetTitle>
          <SheetDescription>Dados completos do pagamento</SheetDescription>
        </SheetHeader>

        {loading && !detalhe ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Dados do pagamento */}
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pagamento
              </h4>
              <Linha
                rotulo="Data"
                valor={v.created ? new Date(v.created).toLocaleString('pt-BR') : ''}
              />
              <Linha
                rotulo="Valor"
                valor={new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(v.amount)}
              />
              <Linha rotulo="Forma" valor={v.forma} />
              <Linha rotulo="Status" valor={status.label} />
              <Linha rotulo="ID iPag" valor={v.ipag_id} />
              <Linha rotulo="Tipo" valor={v.produto_tipo_label} />
              <Linha rotulo="Produto" valor={v.produto_nome} />
              {v.billing_cycle === 'yearly' && <Linha rotulo="Ciclo" valor="Anual" />}
              {v.billing_cycle === 'monthly' && <Linha rotulo="Ciclo" valor="Mensal" />}
              {v.promo_applied && <Linha rotulo="Promoção" valor="Sim" />}
              <Linha rotulo="Vencimento do acesso" valor={v.vencimento} />
            </section>

            <Separator />

            {/* Dados do aluno */}
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Aluno
              </h4>
              <Linha rotulo="Nome" valor={v.aluno} />
              <Linha rotulo="E-mail" valor={v.email} />
              <Linha rotulo="Telefone" valor={v.telefone} />
            </section>

            <Separator />

            {/* Histórico de e-mails */}
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Histórico de e-mails
              </h4>
              {emails.length === 0 && (
                <p className="text-sm text-slate-500">Nenhum e-mail registrado para este aluno.</p>
              )}
              {emails.map((em) => (
                <div key={em.id} className="rounded-md border bg-slate-50 px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {TIPO_EMAIL[em.email_type] || em.email_type}
                    </span>
                    <Badge
                      variant={em.sent ? 'default' : 'destructive'}
                      className={em.sent ? 'bg-emerald-500 border-transparent text-white' : ''}
                    >
                      {em.sent ? 'Enviado' : 'Falhou'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{em.recipient_email}</p>
                  {em.sent_at && (
                    <p className="text-xs text-slate-500">
                      {new Date(em.sent_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                  {em.error_message && (
                    <p className="text-xs text-rose-600 break-words">{em.error_message}</p>
                  )}
                </div>
              ))}
            </section>

            {/* Ações */}
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleReenviar} disabled={reenviando || !v.email} variant="outline">
                {reenviando ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Reenviar e-mail de confirmação
              </Button>
              {/* APENAS botão por enquanto — o fluxo de cancelar/estornar vem na Parte B */}
              <Button variant="destructive" disabled title="Disponível na próxima atualização">
                <Ban className="w-4 h-4 mr-2" />
                Cancelar / estornar
              </Button>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />O cancelamento/estorno será habilitado na próxima
                etapa.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
