import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
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
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import QuestionsList from './QuestionsList'
import type { Simulado } from '@/types'

export default function AdminSimuladoWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [simulado, setSimulado] = useState<Simulado | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Controlled form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab') as string)
    }
  }, [searchParams])

  useEffect(() => {
    if (id && !simulado) {
      setLoading(true)
      getSimulado(id)
        .then((data) => {
          setSimulado(data)
          setTitle(data.title || '')
          setDescription(data.description || '')
          setActive(data.active)
        })
        .catch(() => toast.error('Simulado não encontrado'))
        .finally(() => setLoading(false))
    }
  }, [id, simulado])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Client-side validation
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = 'Título é obrigatório'
    if (!description.trim()) newErrors.description = 'Descrição é obrigatória'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Por favor, corrija os erros no formulário.')
      return
    }

    setSaving(true)
    setErrors({})
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('active', active ? 'true' : 'false')

      if (bannerFile) {
        formData.append('banner', bannerFile)
      }

      if (id) {
        const updated = await updateSimulado(id, formData)
        setSimulado(updated)
        toast.success('Simulado atualizado com sucesso')
        setActiveTab('questions')
      } else {
        const created = await createSimulado(formData)
        setSimulado(created)
        toast.success('Simulado criado com sucesso')
        navigate(`/admin/simulados/${created.id}/editar?tab=questions`, { replace: true })
      }
    } catch (error) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        toast.error('Por favor, corrija os erros no formulário.')
      } else {
        toast.error(getErrorMessage(error) || 'Erro ao salvar o simulado. Tente novamente.')
      }
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
                  <Input
                    id="title"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner">Imagem do Simulado (Opcional)</Label>
                  <Input
                    id="banner"
                    name="banner"
                    type="file"
                    accept="image/jpeg, image/png, image/webp, image/gif"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setBannerFile(e.target.files[0])
                      } else {
                        setBannerFile(null)
                      }
                    }}
                  />
                  {errors.banner && <p className="text-sm text-red-500 mt-1">{errors.banner}</p>}
                  {errors.active && <p className="text-sm text-red-500 mt-1">{errors.active}</p>}
                  {simulado?.banner && !bannerFile && (
                    <div className="mt-2 relative w-64 rounded overflow-hidden border">
                      <img
                        src={pb.files.getURL(simulado, simulado.banner)}
                        alt="Imagem atual"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="active" name="active" checked={active} onCheckedChange={setActive} />
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
