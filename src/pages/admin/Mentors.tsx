import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RichTextEditor } from '@/components/RichTextEditor'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Edit } from 'lucide-react'
import { getMentors, createMentor, updateMentor, deleteMentor } from '@/services/mentors'
import { Mentor } from '@/types'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage, extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminMentors() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Mentor | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const formRef = useRef<HTMLFormElement>(null)

  const load = () => getMentors().then(setMentors).catch(console.error)
  useEffect(() => {
    load()
  }, [])
  useRealtime('mentors', () => {
    load()
  })

  const handleOpen = (m?: Mentor) => {
    setEditing(m || null)
    setFieldErrors({})
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})
    const fd = new FormData(e.currentTarget)
    const photo = fd.get('photo') as File
    if (!photo?.size) fd.delete('photo')
    try {
      if (editing) {
        await updateMentor(editing.id, fd)
        toast({ title: 'Mentor atualizado' })
      } else {
        await createMentor(fd)
        toast({ title: 'Mentor criado' })
      }
      setOpen(false)
      load()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este mentor?')) return
    try {
      await deleteMentor(id)
      toast({ title: 'Mentor excluído' })
      load()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Mentores</h2>
          <p className="text-muted-foreground mt-1">Gerencie perfis de mentores e instrutores.</p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 w-4 h-4" /> Novo Mentor
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tópicos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentors.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.photo && (
                      <img
                        src={pb.files.getUrl(m, m.photo)}
                        alt={m.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-sm text-slate-500 max-w-xs truncate">
                    {m.topics}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpen(m)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mentors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum mentor cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Mentor' : 'Novo Mentor'}</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input name="name" defaultValue={editing?.name} required />
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>
            <div>
              <Label>Tópicos de Atuação *</Label>
              <Input
                name="topics"
                defaultValue={editing?.topics}
                required
                placeholder="Ex: Segurança do Trabalho, NR-10, SIPAT"
              />
              {fieldErrors.topics && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.topics}</p>
              )}
            </div>
            <div>
              <Label>Mini CV (Bio) *</Label>
              <RichTextEditor name="mini_cv" defaultValue={editing?.mini_cv} />
              {fieldErrors.mini_cv && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.mini_cv}</p>
              )}
            </div>
            <div>
              <Label>Foto *</Label>
              <Input type="file" name="photo" accept="image/*" required={!editing} />
              {editing?.photo && (
                <img
                  src={pb.files.getUrl(editing, editing.photo)}
                  alt={editing.name}
                  className="w-20 h-20 rounded-full object-cover mt-2"
                />
              )}
              {fieldErrors.photo && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.photo}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              {editing ? 'Salvar Alterações' : 'Criar Mentor'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
