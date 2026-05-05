import { useState, useEffect } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { SmtpSettings } from '@/types'
import { getSmtpSettings, saveSmtpSettings } from '@/services/email-campaigns'
import { Loader2 } from 'lucide-react'

export function SmtpSettingsForm() {
  const [settings, setSettings] = useState<SmtpSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [enc, setEnc] = useState<string>('TLS')
  const { toast } = useToast()

  useEffect(() => {
    getSmtpSettings().then((data) => {
      if (data) {
        setSettings(data)
        setEnc(data.encryption)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as Partial<SmtpSettings>
    data.port = Number(data.port)
    try {
      const saved = await saveSmtpSettings(settings?.id || null, data)
      setSettings(saved)
      toast({
        title: 'Configurações salvas',
        description: 'Suas configurações SMTP foram atualizadas com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações SMTP</CardTitle>
        <CardDescription>
          Configure os dados do seu servidor de e-mail para envio de campanhas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Servidor SMTP (Host)</Label>
              <Input
                name="host"
                defaultValue={settings?.host}
                required
                placeholder="smtp.exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Porta</Label>
              <Input
                name="port"
                type="number"
                defaultValue={settings?.port}
                required
                placeholder="587"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Input name="user" defaultValue={settings?.user} required />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input name="password" type="password" defaultValue={settings?.password} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Remetente</Label>
              <Input
                name="sender_name"
                defaultValue={settings?.sender_name}
                required
                placeholder="Educação SST"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail do Remetente</Label>
              <Input
                name="sender_email"
                type="email"
                defaultValue={settings?.sender_email}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Criptografia</Label>
            <input type="hidden" name="encryption" value={enc} />
            <Select value={enc} onValueChange={setEnc}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SSL">SSL</SelectItem>
                <SelectItem value="TLS">TLS</SelectItem>
                <SelectItem value="None">Nenhuma</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Configurações
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
