import { useEffect, useState } from 'react'
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
import {
  getInstructors,
  createInstructor,
  updateInstructor,
  deleteInstructor,
} from '@/services/instructors'
import { Instructor } from '@/types'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage, extractFieldErrors, type FieldErrors } from '@/lib/form-errors'
import { validateFile } from '@/lib/file-validation'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { isRichTextEmpty } from '@/lib/utils'

const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PHOTO_MAX_MB = 10

export function InstructorManager() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Instructor | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const load = () => getInstructors().then(setInstructors).catch(console.error)
  useEffect(() => {
    load()
  }, [])
  useRealtime('instructors', () => {
    load()
  })

  const handleOpen = (m?: Instructor) => {
    setEditing(m || null)
    setFieldErrors({})
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})
    const form = e.currentTarget
    const fd = new FormData(form)
    const photo = fd.get('photo') as File
    if (!photo?.size) {
      fd.delete('photo')
    } else {
      const photoError = validateFile(photo, {
        maxSizeMB: PHOTO_MAX_MB,
        mimeTypes: PHOTO_MIME_TYPES,
        label: 'foto do professor',
      })
      if (photoError) {
        toast({ title: 'Foto inválida', description: photoError, variant: 'destructive' })
        return
      }
    }
    const bio = String(fd.get('bio') || '')
    const topics = String(fd.get('topics') || '').trim()
    if (isRichTextEmpty(bio) || !topics) {
      const errs: FieldErrors = {}
      if (isRichTextEmpty(bio)) errs.bio = 'A bio é obrigatória (preencha o editor de texto).'
      if (!topics) errs.topics = 'Os tópicos de atuação são obrigatórios.'
      setFieldErrors(errs)
      toast({
        title: 'Campos obrigatórios',
        description: [errs.bio, errs.topics].filter(Boolean).join(' '),
        variant: 'destructive',
      })
      return
    }
    try {
      if (editing) {
        await updateInstructor(editing.id, fd)
        toast({ title: 'Professor atualizado' })
      } else {
        await createInstructor(fd)
        toast({ title: 'Professor criado' })
      }
      setOpen(false)
      load()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este professor?')) return
    try {
      await deleteInstructor(id)
      toast({ title: 'Professor excluido' })
      load()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif font-bold text-secondary">Professores</h3>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 w-4 h-4" /> Novo Professor
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Topicos</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructors.map((m) => (
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
              {instructors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum professor cadastrado.
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
            <DialogTitle>{editing ? 'Editar Professor' : 'Novo Professor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input name="name" defaultValue={editing?.name} required />
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>
            <div>
              <Label>Topicos de Atuacao *</Label>
              <Input
                name="topics"
                defaultValue={editing?.topics}
                required
                placeholder="Ex: NR-10, Medicina do Trabalho"
              />
              {fieldErrors.topics && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.topics}</p>
              )}
            </div>
            <div>
              <Label>Bio *</Label>
              <RichTextEditor name="bio" defaultValue={editing?.bio} />
              {fieldErrors.bio && <p className="text-xs text-red-500 mt-1">{fieldErrors.bio}</p>}
            </div>
            <div>
              <Label>Foto * (JPG, PNG ou WebP — até 10 MB)</Label>
              <Input type="file" name="photo" accept=".jpg,.jpeg,.png,.webp" required={!editing} />
              {editing?.photo && (
                <img
                  src={pb.files.getUrl(editing, editing.photo)}
                  alt={editing.name}
                  className="w-20 h-20 rounded-full object-cover mt-2"
                />
              )}
            </div>
            <Button type="submit" className="w-full">
              {editing ? 'Salvar Alteracoes' : 'Criar Professor'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
