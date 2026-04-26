import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getSimulado, createSimulado, updateSimulado } from '@/services/simulados'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import QuestionsList from './QuestionsList'
import type { Simulado } from '@/types'

export default function AdminSimuladoWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [simulado, setSimulado] = useState<Simulado | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (id) {
      getSimulado(id)
        .then(setSimulado)
        .catch(() => toast.error('Simulado não encontrado'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)

      const bannerFile = formData.get('banner') as File
      if (bannerFile && bannerFile.size === 0) {
        formData.delete('banner')
      }

      if (id) {
        const updated = await updateSimulado(id, formData)
        setSimulado(updated)
        toast.success('Simulado atualizado com sucesso')
      } else {
        const created = await createSimulado(formData)
        toast.success('Simulado criado com sucesso')
        navigate(`/admin/simulados/${created.id}/editar`)
      }
    } catch (error) {
      toast.error('Erro ao salvar simulado')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/simulados')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">
            {id ? 'Editar Simulado' : 'Novo Simulado'}
          </h2>
          <p className="text-slate-500">Configure as informações e questões do simulado.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="questions" disabled={!id}>
            Questões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <form onSubmit={handleSave}>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" defaultValue={simulado?.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={simulado?.description}
                    required
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner">Imagem de Capa (Banner 16:9)</Label>
                  <Input id="banner" name="banner" type="file" accept="image/*" required={!id} />
                  {simulado?.banner && (
                    <div className="mt-2 relative w-64 aspect-video rounded overflow-hidden border">
                      <img
                        src={pb.files.getURL(simulado, simulado.banner)}
                        alt="Banner atual"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    name="active"
                    defaultChecked={simulado ? simulado.active : true}
                    value="true"
                  />
                  <Label htmlFor="active">Simulado Ativo (Visível para os usuários)</Label>
                </div>
                <div className="pt-4 border-t flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      'Salvando...'
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Salvar Detalhes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Construtor de Questões</CardTitle>
            </CardHeader>
            <CardContent>{id && <QuestionsList simuladoId={id} />}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
