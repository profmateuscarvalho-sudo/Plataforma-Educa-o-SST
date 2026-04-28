import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { DocProjectGuest } from '@/types'
import {
  getDocProjectGuests,
  createDocProjectGuest,
  deleteDocProjectGuest,
} from '@/services/doc_projects'
import { Plus, Trash2, User } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function TabGuests({ projectId }: { projectId: string }) {
  const [guests, setGuests] = useState<DocProjectGuest[]>([])

  const loadAll = async () => {
    try {
      setGuests(await getDocProjectGuests(projectId))
    } catch (e) {
      console.error(e)
    }
  }
  useEffect(() => {
    loadAll()
  }, [projectId])

  const [gName, setGName] = useState('')
  const [gBio, setGBio] = useState('')
  const [gPhoto, setGPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const addGuest = async () => {
    if (gName) {
      setLoading(true)
      try {
        const fd = new FormData()
        fd.append('project', projectId)
        fd.append('name', gName)
        if (gBio) fd.append('bio', gBio)
        if (gPhoto) fd.append('photo', gPhoto)

        await createDocProjectGuest(fd)
        setGName('')
        setGBio('')
        setGPhoto(null)
        loadAll()
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold mb-2">Adicionar Participante / Entrevistado</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Adicione especialistas, professores ou profissionais que serão entrevistados ou farão
          parte do documentário.
        </p>

        <div className="bg-slate-50 p-6 rounded-lg border mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Nome Completo</label>
              <Input
                placeholder="Ex: Dr. João Silva"
                value={gName}
                onChange={(e) => setGName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Foto (Opcional)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setGPhoto(e.target.files?.[0] || null)}
                className="cursor-pointer file:text-sm file:font-medium file:text-primary file:bg-primary/10 file:border-0 file:rounded file:px-3 file:py-1 file:mr-2 hover:file:bg-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Mini-Biografa / Papel</label>
            <Textarea
              placeholder="Especialista em Higiene Ocupacional..."
              value={gBio}
              onChange={(e) => setGBio(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={addGuest} disabled={!gName || loading}>
              {loading ? 'Salvando...' : 'Adicionar Participante'} <Plus className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Participantes Cadastrados</h3>
        {guests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 bg-slate-50 rounded-lg border border-dashed">
            Nenhum participante adicionado ainda.
          </p>
        ) : (
          <Table className="border rounded-md">
            <TableBody>
              {guests.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="w-20">
                    <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border flex items-center justify-center">
                      {g.photo ? (
                        <img
                          src={pb.files.getUrl(g, g.photo)}
                          alt={g.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{g.bio}</div>
                  </TableCell>
                  <TableCell className="text-right w-16">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        deleteDocProjectGuest(g.id)
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
        )}
      </section>
    </div>
  )
}
