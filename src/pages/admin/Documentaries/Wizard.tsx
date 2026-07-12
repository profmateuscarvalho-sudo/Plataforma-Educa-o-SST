import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocProject } from '@/types'
import { getDocProject, createDocProject, updateDocProject } from '@/services/doc_projects'
import { toast } from 'sonner'
import TabIdea from './Tabs/TabIdea'
import TabCosts from './Tabs/TabCosts'
import TabPlanning from './Tabs/TabPlanning'
import TabManagement from './Tabs/TabManagement'
import TabPresentation from './Tabs/TabPresentation'
import TabGuests from './Tabs/TabGuests'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function AdminDocumentaryWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Partial<DocProject>>({ status: 'Novo' })
  const [activeTab, setActiveTab] = useState('idea')

  useEffect(() => {
    if (id) {
      getDocProject(id)
        .then(setProject)
        .catch(() => toast.error('Projeto não encontrado'))
    }
  }, [id])

  const handleSave = async () => {
    try {
      if (id) {
        await updateDocProject(id, project)
        toast.success('Projeto atualizado!')
      } else {
        const res = await createDocProject(project)
        toast.success('Projeto criado com sucesso!')
        navigate(`/admin/documentarios/${res.id}/editar`)
      }
    } catch (e) {
      toast.error('Erro ao salvar projeto')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/documentarios')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-secondary">
            {id ? 'Editar Projeto' : 'Novo Projeto de Documentário'}
          </h2>
          <p className="text-muted-foreground">Assistente de estruturação de produção</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-lg border">
        <Switch
          checked={project.is_free || false}
          onCheckedChange={(checked) => setProject({ ...project, is_free: checked })}
        />
        <Label>Acesso Gratuito (documentário livre para todos os usuários)</Label>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 h-auto p-1 text-sm overflow-x-auto">
          <TabsTrigger value="idea">Ideia</TabsTrigger>
          <TabsTrigger value="costs" disabled={!id}>
            Custos
          </TabsTrigger>
          <TabsTrigger value="planning" disabled={!id}>
            Planejamento
          </TabsTrigger>
          <TabsTrigger value="guests" disabled={!id}>
            Participantes
          </TabsTrigger>
          <TabsTrigger value="management" disabled={!id}>
            Gerenciamento
          </TabsTrigger>
          <TabsTrigger value="presentation" disabled={!id}>
            Apresentação
          </TabsTrigger>
        </TabsList>
        <div className="mt-8 bg-white p-6 rounded-lg border shadow-sm">
          <TabsContent value="idea">
            <TabIdea project={project} onChange={setProject} onSave={handleSave} />
          </TabsContent>
          <TabsContent value="costs">{id && <TabCosts projectId={id} />}</TabsContent>
          <TabsContent value="planning">{id && <TabPlanning projectId={id} />}</TabsContent>
          <TabsContent value="guests">{id && <TabGuests projectId={id} />}</TabsContent>
          <TabsContent value="management">
            {id && <TabManagement project={project} onChange={setProject} onSave={handleSave} />}
          </TabsContent>
          <TabsContent value="presentation">
            {id && <TabPresentation project={project} onChange={setProject} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
