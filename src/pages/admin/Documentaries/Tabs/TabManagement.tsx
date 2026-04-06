import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DocProject } from '@/types'
import pb from '@/lib/pocketbase/client'

interface Props {
  project: Partial<DocProject>
  onChange: (p: Partial<DocProject>) => void
  onSave: () => void
}

export default function TabManagement({ project, onChange, onSave }: Props) {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    pb.collection('users')
      .getFullList({ filter: "role='admin'" })
      .then(setUsers)
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Status do Projeto</label>
          <Select
            value={project.status || 'Novo'}
            onValueChange={(v) => onChange({ ...project, status: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Planejado">Planejado</SelectItem>
              <SelectItem value="Em Pré-produção">Em Pré-produção</SelectItem>
              <SelectItem value="Produção">Produção</SelectItem>
              <SelectItem value="Pós-produção">Pós-produção</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
              <SelectItem value="Novo">Novo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Responsável Principal</label>
          <Select
            value={project.responsible || ''}
            onValueChange={(v) => onChange({ ...project, responsible: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Notas Gerais e Observações</label>
        <Textarea
          rows={6}
          value={project.notes || ''}
          onChange={(e) => onChange({ ...project, notes: e.target.value })}
        />
      </div>

      <Button onClick={onSave} className="w-full">
        Salvar Gerenciamento
      </Button>
    </div>
  )
}
