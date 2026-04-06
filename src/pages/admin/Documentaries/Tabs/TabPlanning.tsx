import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DocProjectRecording, DocProjectTeam, DocProjectTask } from '@/types'
import {
  getDocProjectRecordings,
  createDocProjectRecording,
  deleteDocProjectRecording,
  getDocProjectTeam,
  createDocProjectTeam,
  deleteDocProjectTeam,
  getDocProjectTasks,
  createDocProjectTask,
  updateDocProjectTask,
  deleteDocProjectTask,
} from '@/services/doc_projects'
import { useRealtime } from '@/hooks/use-realtime'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function TabPlanning({ projectId }: { projectId: string }) {
  const [recs, setRecs] = useState<DocProjectRecording[]>([])
  const [team, setTeam] = useState<DocProjectTeam[]>([])
  const [tasks, setTasks] = useState<DocProjectTask[]>([])

  const loadAll = async () => {
    try {
      setRecs(await getDocProjectRecordings(projectId))
      setTeam(await getDocProjectTeam(projectId))
      setTasks(await getDocProjectTasks(projectId))
    } catch (e) {
      console.error(e)
    }
  }
  useEffect(() => {
    loadAll()
  }, [projectId])
  useRealtime('doc_project_tasks', loadAll)

  const [rDate, setRDate] = useState('')
  const [rLoc, setRLoc] = useState('')
  const [tName, setTName] = useState('')
  const [tRole, setTRole] = useState('Diretor')
  const [tkTitle, setTkTitle] = useState('')
  const [tkResp, setTkResp] = useState('')
  const [tkDead, setTkDead] = useState('')

  const addRec = async () => {
    if (rDate && rLoc) {
      await createDocProjectRecording({
        project: projectId,
        date: new Date(rDate).toISOString(),
        location: rLoc,
      })
      setRDate('')
      setRLoc('')
      loadAll()
    }
  }
  const addTeam = async () => {
    if (tName) {
      await createDocProjectTeam({ project: projectId, name: tName, role: tRole })
      setTName('')
      loadAll()
    }
  }
  const addTk = async () => {
    if (tkTitle) {
      await createDocProjectTask({
        project: projectId,
        title: tkTitle,
        responsible: tkResp,
        deadline: tkDead ? new Date(tkDead).toISOString() : undefined,
        status: 'A Fazer',
      })
      setTkTitle('')
      setTkResp('')
      setTkDead('')
      loadAll()
    }
  }

  const kanbanCols = ['A Fazer', 'Em Andamento', 'Concluído']

  return (
    <div className="space-y-12">
      <section>
        <h3 className="text-lg font-semibold mb-4">Cronograma de Gravações</h3>
        <div className="flex gap-2 mb-4">
          <Input type="date" value={rDate} onChange={(e) => setRDate(e.target.value)} />
          <Input placeholder="Local" value={rLoc} onChange={(e) => setRLoc(e.target.value)} />
          <Button onClick={addRec}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Table className="border rounded-md">
          <TableBody>
            {recs.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{format(new Date(r.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{r.location}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      deleteDocProjectRecording(r.id)
                      loadAll()
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Equipe Técnica</h3>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Nome" value={tName} onChange={(e) => setTName(e.target.value)} />
          <Select value={tRole} onValueChange={setTRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                'Diretor',
                'Operador Câmera',
                'Som',
                'Iluminação',
                'Produtor',
                'Roteirista',
                'Outro',
              ].map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addTeam}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Table className="border rounded-md">
          <TableBody>
            {team.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.role}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      deleteDocProjectTeam(t.id)
                      loadAll()
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Quadro de Tarefas (Kanban)</h3>
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Nova tarefa..."
            value={tkTitle}
            onChange={(e) => setTkTitle(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Responsável"
            value={tkResp}
            onChange={(e) => setTkResp(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            value={tkDead}
            onChange={(e) => setTkDead(e.target.value)}
            className="w-40"
          />
          <Button onClick={addTk}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {kanbanCols.map((col) => (
            <div key={col} className="bg-slate-100 p-4 rounded-md border min-h-[300px]">
              <h4 className="font-bold text-sm mb-4">{col}</h4>
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === col)
                  .map((tk) => (
                    <div
                      key={tk.id}
                      className="bg-white p-3 rounded shadow-sm border text-sm group relative"
                    >
                      <p className="font-medium">{tk.title}</p>
                      <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                        <span>{tk.responsible}</span>
                        <span>{tk.deadline && format(new Date(tk.deadline), 'dd/MM')}</span>
                      </div>
                      <Select
                        value={tk.status}
                        onValueChange={async (v: any) => {
                          await updateDocProjectTask(tk.id, { status: v })
                          loadAll()
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {kanbanCols.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
