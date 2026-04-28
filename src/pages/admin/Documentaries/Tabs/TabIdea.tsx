import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { DocProject } from '@/types'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
  project: Partial<DocProject>
  onChange: (p: Partial<DocProject>) => void
  onSave: () => void
}

export default function TabIdea({ project, onChange, onSave }: Props) {
  const [newObj, setNewObj] = useState('')
  const [newTopic, setNewTopic] = useState('')

  const addObjective = () => {
    if (!newObj) return
    onChange({ ...project, objectives: [...(project.objectives || []), newObj] })
    setNewObj('')
  }

  const removeObjective = (idx: number) => {
    const arr = [...(project.objectives || [])]
    arr.splice(idx, 1)
    onChange({ ...project, objectives: arr })
  }

  const addTopic = () => {
    if (!newTopic) return
    onChange({ ...project, topics: [...(project.topics || []), newTopic] })
    setNewTopic('')
  }

  const removeTopic = (idx: number) => {
    const arr = [...(project.topics || [])]
    arr.splice(idx, 1)
    onChange({ ...project, topics: arr })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <label className="text-sm font-medium">Título do Projeto</label>
        <Input
          value={project.title || ''}
          onChange={(e) => onChange({ ...project, title: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Descrição da Ideia Central</label>
        <Textarea
          rows={5}
          value={project.description || ''}
          onChange={(e) => onChange({ ...project, description: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Objetivos</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newObj}
            onChange={(e) => setNewObj(e.target.value)}
            placeholder="Novo objetivo..."
            onKeyDown={(e) => e.key === 'Enter' && addObjective()}
          />
          <Button type="button" onClick={addObjective}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-2">
          {(project.objectives || []).map((obj, i) => (
            <li
              key={i}
              className="flex justify-between items-center bg-slate-50 p-2 rounded border"
            >
              <span className="text-sm">{obj}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeObjective(i)}
                className="h-6 w-6 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Tópicos Abordados</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Novo tópico..."
            onKeyDown={(e) => e.key === 'Enter' && addTopic()}
          />
          <Button type="button" onClick={addTopic}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-2">
          {(project.topics || []).map((topic, i) => (
            <li
              key={i}
              className="flex justify-between items-center bg-slate-50 p-2 rounded border"
            >
              <span className="text-sm">{topic}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTopic(i)}
                className="h-6 w-6 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {' '}
        <div>
          <label className="text-sm font-medium block mb-2">Data Estimada de Lançamento</label>
          <Input
            type="date"
            value={
              project.estimated_release_date ? project.estimated_release_date.split(' ')[0] : ''
            }
            onChange={(e) =>
              onChange({
                ...project,
                estimated_release_date: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : '',
              })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Público-Alvo</label>
          <Select
            value={project.target_audience || ''}
            onValueChange={(v) => onChange({ ...project, target_audience: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Trabalhadores SST">Trabalhadores SST</SelectItem>
              <SelectItem value="Gestores">Gestores</SelectItem>
              <SelectItem value="Treinadores">Treinadores</SelectItem>
              <SelectItem value="Estudantes">Estudantes</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Número de Episódios</label>
          <Input
            type="number"
            min={1}
            value={project.episodes || ''}
            onChange={(e) => onChange({ ...project, episodes: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-4">
          Duração Estimada (minutos): {project.estimated_duration || 10} min
        </label>
        <Slider
          min={10}
          max={120}
          step={5}
          value={[project.estimated_duration || 10]}
          onValueChange={([v]) => onChange({ ...project, estimated_duration: v })}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Estrutura do Roteiro</label>
        <Textarea
          rows={6}
          placeholder="Ato 1: Introdução..."
          value={project.script_structure || ''}
          onChange={(e) => onChange({ ...project, script_structure: e.target.value })}
        />
      </div>

      <Button onClick={onSave} className="w-full">
        Salvar Ideia
      </Button>
    </div>
  )
}
