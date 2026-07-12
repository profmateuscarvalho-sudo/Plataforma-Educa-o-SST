import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getStudentNotes,
  createStudentNote,
  updateStudentNote,
  deleteStudentNote,
} from '@/services/student-notes'
import { StudentNote } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Save, Notebook } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function StudentNotebook() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const loadNotes = useCallback(async () => {
    if (!user) return
    try {
      const list = await getStudentNotes(user.id)
      setNotes(list)
    } catch {
      /* ignore */
    }
  }, [user])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  useRealtime('student_notes', () => {
    loadNotes()
  })

  const selected = notes.find((n) => n.id === selectedId) || null

  useEffect(() => {
    if (selected) {
      setTitle(selected.title || '')
      setContent(selected.content || '')
    } else {
      setTitle('')
      setContent('')
    }
  }, [selectedId, notes])

  const handleNewNote = () => {
    setSelectedId(null)
    setTitle('')
    setContent('')
  }

  const handleSave = async () => {
    if (!user) return
    if (!title.trim() && !content.trim()) {
      toast({ title: 'Adicione um título ou conteúdo.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        user: user.id,
        title: title.trim() || 'Sem título',
        content,
      }
      if (selectedId) {
        await updateStudentNote(selectedId, payload)
      } else {
        const created = await createStudentNote(payload)
        setSelectedId(created.id)
      }
      toast({ title: 'Nota salva!' })
      await loadNotes()
    } catch {
      toast({ title: 'Erro ao salvar nota.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    try {
      await deleteStudentNote(selectedId)
      setSelectedId(null)
      await loadNotes()
      toast({ title: 'Nota excluída.' })
    } catch {
      toast({ title: 'Erro ao excluir nota.', variant: 'destructive' })
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="min-h-[calc(100vh-56px)] bg-zinc-950 text-white">
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-white/10 py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Notebook className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-white">Caderno Virtual</h1>
            <p className="text-white/50 text-sm">Suas anotações de estudo</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <div className="space-y-2">
            <Button
              onClick={handleNewNote}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-none"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Nota
            </Button>
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">Nenhuma nota ainda.</p>
              ) : (
                notes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedId(n.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all',
                      selectedId === n.id
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]',
                    )}
                  >
                    <p className="font-medium text-sm text-white/90 truncate">
                      {n.title || 'Sem título'}
                    </p>
                    <p className="text-xs text-white/30 mt-1">{formatDate(n.updated)}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-white/10">
              <Input
                placeholder="Título da nota..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold border-none bg-transparent text-white placeholder:text-white/30 focus-visible:ring-0 px-0"
              />
              <div className="flex gap-2 shrink-0">
                {selectedId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-600 text-black border-none"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
            <Textarea
              placeholder="Escreva suas anotações aqui..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] resize-y border-none bg-transparent text-white/90 placeholder:text-white/30 focus-visible:ring-0 rounded-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
