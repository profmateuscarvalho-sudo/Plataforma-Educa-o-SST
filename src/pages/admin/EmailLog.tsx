import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { getEmailLogs, getUsersForLog, getSubscriptionsForLog } from '@/services/email-logs'
import { EmailLog, User } from '@/types'
import { Subscription } from '@/services/subscriptions'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const EMAIL_TYPE_LABELS: Record<string, string> = {
  lead: 'Confirmação de Lead',
  activation_free: 'Ativação Free',
  activation_paid: 'Verificação Paga',
  payment_confirmed: 'Pagamento Confirmado',
  upgrade: 'Upgrade de Plano',
  brevo_sync: 'Sync Brevo',
}

interface LogRow {
  id: string
  name: string
  email: string
  emailType: string
  sent: boolean
  sentAt: string | null
  emailVerified: boolean
  subscriptionStatus: string | null
  brevoSynced: boolean
  brevoListId: number
  errorMessage: string
  created: string
}

export default function AdminEmailLog() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [logsRes, usersRes, subsRes] = await Promise.all([
          getEmailLogs(),
          getUsersForLog(),
          getSubscriptionsForLog(),
        ])
        setLogs(logsRes)
        setUsers(usersRes)
        setSubscriptions(subsRes)
      } catch (err) {
        console.error('Failed to load email logs:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const userMap = useMemo(() => {
    const map = new Map<string, User>()
    users.forEach((u) => {
      const email = u.email?.toString().trim().toLowerCase()
      if (email) map.set(email, u)
    })
    return map
  }, [users])

  const subMap = useMemo(() => {
    const map = new Map<string, Subscription>()
    subscriptions.forEach((s) => map.set(s.user, s))
    return map
  }, [subscriptions])

  const rows: LogRow[] = useMemo(() => {
    return logs.map((log) => {
      const expanded = log.expand as { user?: User; subscription?: Subscription }
      const rawEmail = log.recipient_email?.toString().trim() ?? ''
      const user = expanded?.user || (rawEmail ? userMap.get(rawEmail.toLowerCase()) : undefined)
      const subscription = expanded?.subscription || (user ? subMap.get(user.id) : undefined)

      return {
        id: log.id,
        name: log.recipient_name?.toString() || user?.name || '—',
        email: log.recipient_email?.toString() || '',
        emailType: log.email_type,
        sent: log.sent,
        sentAt: log.sent_at,
        emailVerified: user?.email_verificado ?? false,
        subscriptionStatus: subscription?.status ?? null,
        brevoSynced: log.brevo_synced,
        brevoListId: log.brevo_list_id,
        errorMessage: log.error_message || '',
        created: log.created,
      }
    })
  }, [logs, userMap, subMap])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '—'
    }
  }

  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set())

  const toggleError = (id: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-secondary">Log de E-mails e Ativação</h2>
        <p className="text-slate-500 mt-1">
          Monitore o ciclo de comunicações transacionais e status de ativação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-secondary">{logs.length}</p>
              <p className="text-xs text-slate-500">Total de Registros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-secondary">
                {logs.filter((l) => l.sent).length}
              </p>
              <p className="text-xs text-slate-500">E-mails Enviados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-secondary">
                {rows.filter((r) => r.emailVerified).length}
              </p>
              <p className="text-xs text-slate-500">E-mails Verificados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <RefreshCw className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-bold text-secondary">
                {logs.filter((l) => l.brevo_synced).length}
              </p>
              <p className="text-xs text-slate-500">Syncs Brevo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-secondary">
                {rows.filter((r) => r.errorMessage).length}
              </p>
              <p className="text-xs text-slate-500">Com Erro</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Nome / Email</TableHead>
                <TableHead>Tipo de Email</TableHead>
                <TableHead>Email Enviado</TableHead>
                <TableHead>Email Verificado</TableHead>
                <TableHead>Status Assinatura</TableHead>
                <TableHead>Brevo Sync</TableHead>
                <TableHead>Erro Técnico</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="w-8 p-2">
                    {row.errorMessage && (
                      <button
                        onClick={() => toggleError(row.id)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {expandedErrors.has(row.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-800">{row.name}</div>
                    <div className="text-xs text-slate-500">{row.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {EMAIL_TYPE_LABELS[row.emailType] || row.emailType || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {row.sent ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-xs text-slate-500">{formatDate(row.sentAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.emailVerified ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Verificado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.subscriptionStatus === 'active' ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Ativa
                      </Badge>
                    ) : row.subscriptionStatus === 'pending' ? (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Pendente
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.brevoSynced ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-slate-500">Lista {row.brevoListId}</span>
                      </div>
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300" />
                    )}
                  </TableCell>
                  <TableCell>
                    {row.errorMessage ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="max-w-[180px] truncate text-left">
                              {row.errorMessage}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="max-w-md p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 font-semibold text-red-700">
                              <AlertTriangle className="w-4 h-4" />
                              Detalhe do Erro
                            </div>
                            <p className="text-xs text-slate-600 break-words whitespace-pre-wrap">
                              {row.errorMessage}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(row.created)}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
