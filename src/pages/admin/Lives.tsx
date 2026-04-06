import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { LiveSession } from '@/types'
import { toast } from '@/hooks/use-toast'

export default function AdminLives() {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LiveSession | null>(null)
  const [status, setStatus] = useState<string>('scheduled')

  const load = () => getLiveSessions().then(setSessions)
  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = {
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      panda_video_id: fd.get('panda_video_id') as string,
      scheduled_at: fd.get('scheduled_at') as string,
      status: status as 'scheduled' | 'live' | 'finished',
    }
    try {
      if (editing) await updateLiveSession(editing.id, data)
      else await createLiveSession(data)
      toast({ title: 'Sessão salva' })
      setOpen(false)
      setEditing(null)
      load()
    } catch (err) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold text-secondary">Aulas ao Vivo</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) setEditing(null)
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setStatus('scheduled')}>
              <Plus className="mr-2 w-4 h-4" /> Nova Sessão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Sessão' : 'Nova Sessão'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input name="title" defaultValue={editing?.title} required />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input name="description" defaultValue={editing?.description} />
              </div>
              <div>
                <Label>Video ID ou Stream Key (Panda/OBS)</Label>
                <Input name="panda_video_id" defaultValue={editing?.panda_video_id} required />
              </div>
              <div>
                <Label>Data Agendada</Label>
                <Input
                  type="datetime-local"
                  name="scheduled_at"
                  defaultValue={editing?.scheduled_at?.slice(0, 16)}
                  required
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendada</SelectItem>
                    <SelectItem value="live">Ao Vivo</SelectItem>
                    <SelectItem value="finished">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0 divide-y">
          {sessions.map((s) => (
            <div key={s.id} className="flex justify-between items-center p-4 hover:bg-slate-50">
              <div>
                <p className="font-bold">
                  {s.title}{' '}
                  <span className="text-xs bg-slate-200 px-2 py-1 rounded ml-2">{s.status}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(s.scheduled_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(s)
                    setStatus(s.status)
                    setOpen(true)
                  }}
                >
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
            <div className="p-4 text-center text-slate-500">Nenhuma aula ao vivo cadastrada.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
