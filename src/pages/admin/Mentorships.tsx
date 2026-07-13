import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  getMentorships,
  createMentorship,
  updateMentorship,
  deleteMentorship,
} from '@/services/mentorships'
import { Mentorship } from '@/types'
import { toast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MentorshipForm } from '@/components/admin/MentorshipForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MentorManager } from '@/components/admin/MentorManager'

export default function AdminMentorships() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Mentorship | null>(null)
  const [isFree, setIsFree] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const load = () => getMentorships().then(setMentorships).catch(console.error)

  useEffect(() => {
    load()
  }, [])

  useRealtime('mentorships', () => {
    load()
  })

  const handleOpen = (m?: Mentorship) => {
    setEditing(m || null)
    setIsFree(m?.is_free || false)
    setFieldErrors({})
    setOpen(true)
  }

  const handleSubmit = async (fd: FormData) => {
    setFieldErrors({})
    try {
      if (editing) {
        await updateMentorship(editing.id, fd)
        toast({ title: 'Mentoria atualizada com sucesso' })
      } else {
        await createMentorship(fd)
        toast({ title: 'Mentoria criada com sucesso' })
      }
      setOpen(false)
      load()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mentoria?')) return
    try {
      await deleteMentorship(id)
      toast({ title: 'Mentoria excluída com sucesso' })
      load()
    } catch (err) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="programs" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="programs">Programas</TabsTrigger>
          <TabsTrigger value="mentors">Mentores</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-serif font-bold text-secondary">Mentorias</h2>
              <p className="text-muted-foreground mt-1">
                Gerencie os programas de mentoria e sessões disponíveis.
              </p>
            </div>
            <Button onClick={() => handleOpen()}>
              <Plus className="mr-2 w-4 h-4" /> Nova Mentoria
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Programa</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentorships.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {m.mentor_photo ? (
                            <img
                              src={pb.files.getUrl(m, m.mentor_photo)}
                              alt="Mentor"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : m.expand?.mentor?.photo ? (
                            <img
                              src={pb.files.getUrl(m.expand.mentor, m.expand.mentor.photo)}
                              alt="Mentor"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200" />
                          )}
                          {m.expand?.mentor?.name || m.mentor_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {m.is_free
                          ? 'Gratuito'
                          : new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(m.price)}
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
                  {mentorships.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhuma mentoria cadastrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentors">
          <MentorManager />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Mentoria' : 'Nova Mentoria'}</DialogTitle>
          </DialogHeader>
          <MentorshipForm
            editing={editing}
            isFree={isFree}
            setIsFree={setIsFree}
            onSubmit={handleSubmit}
            fieldErrors={fieldErrors}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
