import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save } from 'lucide-react'
import { DocProject } from '@/types'
import { getDocProject, createDocProject, updateDocProject } from '@/services/doc_projects'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'

export default function AdminDocumentaryWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Partial<DocProject>>({ is_free: true })
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  useEffect(() => {
    if (id) {
      getDocProject(id)
        .then(setProject)
        .catch(() => toast.error('Documentário não encontrado'))
    }
  }, [id])

  const handleSave = async () => {
    if (!project.title) {
      toast.error('Título é obrigatório')
      return
    }
    setLoading(true)
    try {
      if (id) {
        const fd = new FormData()
        fd.append('title', project.title || '')
        fd.append('description', project.description || '')
        fd.append('panda_video_id', project.panda_video_id || '')
        fd.append('is_free', String(project.is_free ?? true))
        if (photoFile) fd.append('presentation_photos', photoFile)
        await updateDocProject(id, fd as any)
        toast.success('Documentário atualizado!')
      } else {
        const res = await createDocProject({
          title: project.title || '',
          description: project.description || '',
          panda_video_id: project.panda_video_id || '',
          is_free: project.is_free ?? true,
        })
        if (photoFile) {
          const fd = new FormData()
          fd.append('presentation_photos', photoFile)
          await updateDocProject(res.id, fd as any)
        }
        toast.success('Documentário criado!')
        navigate(`/admin/documentarios/${res.id}/editar`)
      }
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const coverUrl =
    project.presentation_photos?.length && !photoFile
      ? pb.files.getUrl(project as any, project.presentation_photos[0])
      : null

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/documentarios')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-secondary">
            {id ? 'Editar Documentário' : 'Novo Documentário'}
          </h2>
          <p className="text-muted-foreground">Preencha as informações do conteúdo</p>
        </div>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
        <div className="space-y-2">
          <Label>Título *</Label>
          <Input
            value={project.title || ''}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            placeholder="Título do documentário"
          />
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea
            className="min-h-[120px]"
            value={project.description || ''}
            onChange={(e) => setProject({ ...project, description: e.target.value })}
            placeholder="Descrição do documentário"
          />
        </div>

        <div className="space-y-2">
          <Label>ID do Vídeo (Panda Video)</Label>
          <Input
            value={project.panda_video_id || ''}
            onChange={(e) => setProject({ ...project, panda_video_id: e.target.value })}
            placeholder="ID do vídeo ou URL de embed"
          />
          <p className="text-xs text-muted-foreground">
            Insira o ID do vídeo ou a URL de embed da Panda Video.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Capa / Thumbnail</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            className="cursor-pointer"
          />
          {coverUrl && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Capa atual:</p>
              <img
                src={coverUrl}
                alt="Capa atual"
                className="h-32 rounded-lg border object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={project.is_free ?? true}
            onCheckedChange={(checked) => setProject({ ...project, is_free: checked })}
          />
          <Label>Acesso Liberado</Label>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={loading || !project.title}>
            {loading ? (
              'Salvando...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Salvar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
