import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DocProject } from '@/types'
import { Save, Plus, Trash2 } from 'lucide-react'

export default function TabIdea({
  project,
  onChange,
  onSave,
}: {
  project: Partial<DocProject>
  onChange: (p: Partial<DocProject>) => void
  onSave: () => void
}) {
  const [newTopic, setNewTopic] = useState('')
  const [newObjective, setNewObjective] = useState('')

  const handleAddTopic = () => {
    if (!newTopic.trim()) return
    const topics = project.topics || []
    onChange({ ...project, topics: [...topics, newTopic.trim()] })
    setNewTopic('')
  }

  const handleAddObjective = () => {
    if (!newObjective.trim()) return
    const objectives = project.objectives || []
    onChange({ ...project, objectives: [...objectives, newObjective.trim()] })
    setNewObjective('')
  }

  const removeTopic = (index: number) => {
    const topics = [...(project.topics || [])]
    topics.splice(index, 1)
    onChange({ ...project, topics })
  }

  const removeObjective = (index: number) => {
    const objectives = [...(project.objectives || [])]
    objectives.splice(index, 1)
    onChange({ ...project, objectives })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Título do Documentário *</Label>
          <Input
            value={project.title || ''}
            onChange={(e) => onChange({ ...project, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={project.status || ''}
            onValueChange={(v) => onChange({ ...project, status: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {[
                'Planejado',
                'Em Pré-produção',
                'Produção',
                'Pós-produção',
                'Finalizado',
                'Novo',
              ].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Público Alvo</Label>
          <Select
            value={project.target_audience || ''}
            onValueChange={(v) => onChange({ ...project, target_audience: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {['Trabalhadores SST', 'Gestores', 'Treinadores', 'Estudantes', 'Outros'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Duração Estimada (minutos)</Label>
          <Input
            type="number"
            value={project.estimated_duration || ''}
            onChange={(e) => onChange({ ...project, estimated_duration: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Data Estimada de Lançamento</Label>
          <Input
            type="date"
            min="1900-01-01"
            max="2100-12-31"
            value={
              project.estimated_release_date
                ? String(project.estimated_release_date).substring(0, 10)
                : ''
            }
            onChange={(e) => {
              const val = e.target.value
              if (!val) {
                onChange({ ...project, estimated_release_date: '' })
                return
              }
              if (val.length === 10) {
                const year = parseInt(val.split('-')[0], 10)
                if (year >= 1900 && year <= 2100) {
                  onChange({ ...project, estimated_release_date: `${val} 12:00:00.000Z` })
                }
              }
            }}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Número de Episódios</Label>
          <Input
            type="number"
            value={project.episodes || ''}
            onChange={(e) => onChange({ ...project, episodes: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Orçamento Total Estimado (R$)</Label>
          <Input
            type="number"
            value={project.total_budget || ''}
            onChange={(e) => onChange({ ...project, total_budget: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição / Sinopse</Label>
        <Textarea
          className="min-h-[100px]"
          value={project.description || ''}
          onChange={(e) => onChange({ ...project, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Estrutura de Roteiro</Label>
        <Textarea
          className="min-h-[100px]"
          value={project.script_structure || ''}
          onChange={(e) => onChange({ ...project, script_structure: e.target.value })}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Label>Objetivos</Label>
          <div className="flex gap-2">
            <Input
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Novo objetivo..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddObjective()}
            />
            <Button type="button" onClick={handleAddObjective} variant="secondary">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {(project.objectives || []).map((obj: string, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-50 p-2 rounded text-sm border"
              >
                <span>{obj}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500"
                  onClick={() => removeObjective(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label>Tópicos Abordados</Label>
          <div className="flex gap-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Novo tópico..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
            />
            <Button type="button" onClick={handleAddTopic} variant="secondary">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {(project.topics || []).map((topic: string, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-50 p-2 rounded text-sm border"
              >
                <span>{topic}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500"
                  onClick={() => removeTopic(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notas Adicionais</Label>
        <Textarea
          className="min-h-[80px]"
          value={project.notes || ''}
          onChange={(e) => onChange({ ...project, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={onSave}>
          <Save className="h-4 w-4 mr-2" /> Salvar Projeto
        </Button>
      </div>
    </div>
  )
}
