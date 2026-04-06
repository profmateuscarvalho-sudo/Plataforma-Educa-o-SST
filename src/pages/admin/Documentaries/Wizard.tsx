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
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="idea">Ideia e Estrutura</TabsTrigger>
          <TabsTrigger value="costs" disabled={!id}>
            Previsão de Custos
          </TabsTrigger>
          <TabsTrigger value="planning" disabled={!id}>
            Planejamento
          </TabsTrigger>
          <TabsTrigger value="management" disabled={!id}>
            Gerenciamento
          </TabsTrigger>
        </TabsList>
        <div className="mt-8 bg-white p-6 rounded-lg border shadow-sm">
          <TabsContent value="idea">
            <TabIdea project={project} onChange={setProject} onSave={handleSave} />
          </TabsContent>
          <TabsContent value="costs">{id && <TabCosts projectId={id} />}</TabsContent>
          <TabsContent value="planning">{id && <TabPlanning projectId={id} />}</TabsContent>
          <TabsContent value="management">
            {id && <TabManagement project={project} onChange={setProject} onSave={handleSave} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
