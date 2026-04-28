import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Copy, ExternalLink, Save } from 'lucide-react'
import { DocProject } from '@/types'
import { updateDocProject } from '@/services/doc_projects'

export default function TabPresentation({
  project,
  onChange,
}: {
  project: Partial<DocProject>
  onChange: (p: Partial<DocProject>) => void
}) {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<FileList | null>(null)

  const handleSave = async () => {
    if (!project.id) return
    setLoading(true)
    try {
      const fd = new FormData()
      if (project.slug) fd.append('slug', project.slug)
      if (project.methodology) fd.append('methodology', project.methodology)
      if (project.investment_quota)
        fd.append('investment_quota', project.investment_quota.toString())

      if (files) {
        for (let i = 0; i < files.length; i++) {
          fd.append('presentation_photos', files[i])
        }
      }

      const updated = await updateDocProject(project.id, fd as any)
      onChange(updated)
      setFiles(null)
      toast.success('Apresentação salva com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar apresentação')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    const url = `${window.location.origin}/documentarios/projeto/${project.slug || project.id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado para a área de transferência')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <div>
          <h3 className="text-lg font-medium text-secondary">Apresentação Pública (Pitch)</h3>
          <p className="text-sm text-muted-foreground">
            Configure os dados exibidos na landing page para investidores.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyLink} disabled={!project.slug && !project.id}>
            <Copy className="h-4 w-4 mr-2" /> Copiar Link
          </Button>
          {(project.slug || project.id) && (
            <Button variant="outline" asChild>
              <a
                href={`/documentarios/projeto/${project.slug || project.id}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" /> Ver Página
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Slug da URL (ex: nome-do-projeto)</Label>
          <Input
            value={project.slug || ''}
            onChange={(e) => onChange({ ...project, slug: e.target.value })}
            placeholder="nome-do-projeto"
          />
        </div>
        <div className="space-y-2">
          <Label>Valor da Cota por Empresa (R$)</Label>
          <Input
            type="number"
            value={project.investment_quota || ''}
            onChange={(e) => onChange({ ...project, investment_quota: Number(e.target.value) })}
            placeholder="Ex: 50000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Metodologia / Abordagem do Documentário</Label>
        <Textarea
          className="min-h-[150px]"
          value={project.methodology || ''}
          onChange={(e) => onChange({ ...project, methodology: e.target.value })}
          placeholder="Descreva a metodologia em formato de texto para encantar os patrocinadores..."
        />
        <p className="text-xs text-muted-foreground">
          Suporta quebras de linha e formatação HTML simples.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Fotos de Impacto (Selecione múltiplas imagens)</Label>
        <Input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />
        {project.presentation_photos && project.presentation_photos.length > 0 && !files && (
          <p className="text-sm text-amber-600 mt-2">
            {project.presentation_photos.length} foto(s) configuradas. Fazer um novo upload
            substituirá as fotos atuais.
          </p>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            'Salvando...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Salvar Apresentação
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
