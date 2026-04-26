import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getSimulado, createSimulado, updateSimulado } from '@/services/simulados'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import QuestionsList from './QuestionsList'
import type { Simulado } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  active: z.boolean().default(true),
  banner: z.any().optional(),
})

type FormValues = z.infer<typeof schema>

export default function AdminSimuladoWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [simulado, setSimulado] = useState<Simulado | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', active: true },
  })

  useEffect(() => {
    if (searchParams.get('tab')) setActiveTab(searchParams.get('tab') as string)
  }, [searchParams])

  useEffect(() => {
    if (id && !simulado) {
      setLoading(true)
      getSimulado(id)
        .then((data) => {
          setSimulado(data)
          form.reset({
            title: data.title || '',
            description: data.description || '',
            active: data.active,
          })
        })
        .catch(() => toast.error('Simulado não encontrado'))
        .finally(() => setLoading(false))
    }
  }, [id, simulado, form])

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', values.title.trim())
      formData.append('description', values.description.trim())
      formData.append('active', values.active ? 'true' : 'false')

      if (values.banner instanceof File) {
        formData.append('banner', values.banner)
      } else if (values.banner instanceof FileList && values.banner.length > 0) {
        formData.append('banner', values.banner[0])
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
        Object.entries(fieldErrors).forEach(([f, m]) =>
          form.setError(f as keyof FormValues, { message: m }),
        )
        toast.error('Corrija os erros no formulário.')
      } else {
        toast.error(getErrorMessage(error) || 'Erro ao salvar o simulado.')
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="banner"
                    render={({ field: { value, onChange, ...rest } }) => (
                      <FormItem>
                        <FormLabel>Imagem do Simulado (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            {...rest}
                            type="file"
                            accept="image/*"
                            onChange={(e) => onChange(e.target.files?.[0])}
                          />
                        </FormControl>
                        <FormMessage />
                        {simulado?.banner && !(value instanceof File) && (
                          <div className="mt-2 w-64 rounded overflow-hidden border">
                            <img
                              src={pb.files.getURL(simulado, simulado.banner)}
                              alt="Banner"
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Simulado Ativo (Visível para os usuários)</FormLabel>
                      </FormItem>
                    )}
                  />
                  <div className="pt-4 border-t flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" /> Salvar Detalhes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Form>
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
