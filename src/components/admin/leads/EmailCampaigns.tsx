import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { RichTextEditor } from '@/components/RichTextEditor'
import { EmailCampaign } from '@/types'
import { getEmailCampaigns, sendEmailCampaign } from '@/services/email-campaigns'
import { Loader2, Send } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadCampaigns = () =>
    getEmailCampaigns()
      .then(setCampaigns)
      .catch(() => {})
  useEffect(() => {
    loadCampaigns()
  }, [])

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const subject = formData.get('subject') as string
    const content = formData.get('content') as string

    try {
      const res = await sendEmailCampaign({ subject, content })
      toast({
        title: 'Campanha finalizada',
        description: `${res.sent} e-mails enviados com sucesso.`,
      })
      if (res.failed > 0) {
        toast({
          title: 'Aviso',
          description: `${res.failed} e-mails falharam ao enviar.`,
          variant: 'destructive',
        })
      }
      ;(e.target as HTMLFormElement).reset()
      loadCampaigns()
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Nova Campanha</CardTitle>
          <CardDescription>Envie um e-mail em massa para todos os seus leads.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label>Assunto do E-mail</Label>
              <Input name="subject" required placeholder="Novidades da Educação SST!" />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo (HTML)</Label>
              <RichTextEditor name="content" defaultValue="" />
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar para Todos os Leads
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Campanhas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Destinatários</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{new Date(c.created).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="font-medium">{c.subject}</TableCell>
                  <TableCell>{c.total_recipients}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${c.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {c.status === 'sent' ? 'Enviado' : 'Falha'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Nenhuma campanha enviada ainda.
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
