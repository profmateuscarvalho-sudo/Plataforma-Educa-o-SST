import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { EmailCampaign, Course, Magazine } from '@/types'
import { getEmailCampaigns, sendEmailCampaign } from '@/services/email-campaigns'
import { getCourses } from '@/services/courses'
import { getMagazines } from '@/services/magazines'
import { Loader2, Send } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [loading, setLoading] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [templateContent, setTemplateContent] = useState('')
  const { toast } = useToast()

  const loadCampaigns = () =>
    getEmailCampaigns()
      .then(setCampaigns)
      .catch(() => {})

  useEffect(() => {
    loadCampaigns()
    getCourses()
      .then(setCourses)
      .catch(() => {})
    getMagazines()
      .then(setMagazines)
      .catch(() => {})
  }, [])

  const handleContentSelect = (val: string) => {
    if (!val) return
    const [type, id] = val.split(':')
    let title = ''
    let desc = ''
    let link = ''

    if (type === 'course') {
      const c = courses.find((x) => x.id === id)
      if (c) {
        title = c.title
        desc = c.description || ''
        link = `https://www.educacaosst.com.br/cursos/${c.id}`
      }
    } else {
      const m = magazines.find((x) => x.id === id)
      if (m) {
        title = m.title
        desc = m.summary || ''
        link = `https://www.educacaosst.com.br/revistas`
      }
    }

    if (title) {
      const html = `<h2>${title}</h2><p>${desc}</p><p><br></p><p><a href="${link}" style="display:inline-block;padding:12px 24px;background-color:#059669;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Acessar Conteúdo</a></p><p><br></p>`
      setTemplateContent(html)
      setEditorKey((k) => k + 1)
    }
  }

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
              <Label>Anexar Conteúdo (Opcional - substitui o texto atual)</Label>
              <Select onValueChange={handleContentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso ou revista para gerar o template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Cursos</SelectLabel>
                    {courses.map((c) => (
                      <SelectItem key={`course:${c.id}`} value={`course:${c.id}`}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Revistas</SelectLabel>
                    {magazines.map((m) => (
                      <SelectItem key={`mag:${m.id}`} value={`mag:${m.id}`}>
                        {m.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo (HTML)</Label>
              <RichTextEditor key={editorKey} name="content" defaultValue={templateContent} />
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
