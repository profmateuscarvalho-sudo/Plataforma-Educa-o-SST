import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Edit } from 'lucide-react'
import {
  getLiveSessions,
  createLiveSession,
  updateLiveSession,
  deleteLiveSession,
} from '@/services/live'
import { getInstructors } from '@/services/instructors'
import { LiveSession, Instructor } from '@/types'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useRealtime } from '@/hooks/use-realtime'
import { InstructorManager } from '@/components/admin/InstructorManager'

export default function AdminLives() {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LiveSession | null>(null)
  const [status, setStatus] = useState('scheduled')
  const [instructorId, setInstructorId] = useState('')
  const [instructorName, setInstructorName] = useState('')

  const load = () => getLiveSessions().then(setSessions)
  useEffect(() => {
    load()
    getInstructors()
      .then(setInstructors)
      .catch(() => {})
  }, [])
  useRealtime('live_sessions', () => {
    load()
  })

  const selectedInstructor = instructors.find((m) => m.id === instructorId)

  const handleOpenNew = () => {
    setEditing(null)
    setStatus('scheduled')
    setInstructorId('')
    setInstructorName('')
    setOpen(true)
  }

  const handleOpenEdit = (s: LiveSession) => {
    setEditing(s)
    setStatus(s.status)
    setInstructorId(s.instructor || '')
    setInstructorName(s.instructor_name || '')
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const finalInstructor =
      selectedInstructor?.name || instructorName || (fd.get('instructor_name') as string)
    let scheduledDate = fd.get('scheduled_at') as string
    if (scheduledDate) {
      try {
        scheduledDate = new Date(scheduledDate).toISOString()
      } catch {
        // ignore
      }
    }

    const data: Record<string, any> = {
      title: fd.get('title'),
      description: fd.get('description'),
      panda_video_id: fd.get('panda_video_id'),
      scheduled_at: scheduledDate,
      status,
      instructor_name: finalInstructor,
      instructor: instructorId || null,
    }
    try {
      if (editing) await updateLiveSession(editing.id, data)
      else await createLiveSession(data)
      toast({ title: 'Sessao salva' })
      setOpen(false)
      setEditing(null)
      load()
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="sessions">Sessoes</TabsTrigger>
          <TabsTrigger value="instructors">Cadastrar Professor</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-serif font-bold text-secondary">Aulas ao Vivo</h2>
            <Button onClick={handleOpenNew}>
              <Plus className="mr-2 w-4 h-4" /> Nova Sessao
            </Button>
          </div>
          <Card>
            <CardContent className="p-0 divide-y">
              {sessions.map((s) => (
                <div key={s.id} className="flex justify-between items-center p-4 hover:bg-slate-50">
                  <div>
                    <p className="font-bold">
                      {s.title}{' '}
                      <span className="text-xs bg-slate-200 px-2 py-1 rounded ml-2">
                        {s.status}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(s.scheduled_at).toLocaleString('pt-BR')}
                      {s.instructor_name && ` - ${s.instructor_name}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(s)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={async () => {
                        await deleteLiveSession(s.id)
                        load()
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="p-4 text-center text-slate-500">
                  Nenhuma aula ao vivo cadastrada.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructors">
          <InstructorManager />
        </TabsContent>
      </Tabs>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Sessao' : 'Nova Sessao'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Titulo *</Label>
              <Input name="title" defaultValue={editing?.title} required />
            </div>
            <div>
              <Label>Descricao</Label>
              <Input name="description" defaultValue={editing?.description} />
            </div>
            <div>
              <Label>Video ID ou Chave de Transmissao</Label>
              <Input
                name="panda_video_id"
                defaultValue={editing?.panda_video_id}
                placeholder="ex: 12345-abcde"
              />
            </div>
            <div>
              <Label>Data Agendada *</Label>
              <Input
                type="datetime-local"
                name="scheduled_at"
                defaultValue={editing?.scheduled_at?.replace(' ', 'T').slice(0, 16)}
                required
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="live">Ao Vivo</SelectItem>
                  <SelectItem value="finished">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-bold text-secondary">Professor / Instrutor</p>
              <div>
                <Label>Selecionar Professor</Label>
                <Select
                  value={instructorId}
                  onValueChange={(v) => {
                    setInstructorId(v)
                    const m = instructors.find((x) => x.id === v)
                    if (m) setInstructorName(m.name)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedInstructor && (
                <div className="p-4 bg-slate-50 rounded-lg border space-y-2">
                  <p className="font-bold text-secondary">{selectedInstructor.name}</p>
                  <p className="text-sm text-slate-500">{selectedInstructor.topics}</p>
                  <div
                    className="text-sm text-slate-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedInstructor.bio }}
                  />
                </div>
              )}
              <div>
                <Label>Nome do Instrutor (manual)</Label>
                <Input
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="Nome do instrutor"
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
