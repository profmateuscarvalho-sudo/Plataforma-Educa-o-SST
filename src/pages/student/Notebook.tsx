import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getStudentNotes,
  createStudentNote,
  updateStudentNote,
  deleteStudentNote,
} from '@/services/student-notes'
import { StudentNote, ItineraryStep } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Save, BookOpen, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function StudentNotebook() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [itinerary, setItinerary] = useState<ItineraryStep[]>([])
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
      setItinerary(
        Array.isArray(selected.itinerary_data) ? (selected.itinerary_data as ItineraryStep[]) : [],
      )
    } else {
      setTitle('')
      setContent('')
      setItinerary([])
    }
  }, [selectedId, notes])

  const handleNewNote = () => {
    setSelectedId(null)
    setTitle('')
    setContent('')
    setItinerary([])
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
        itinerary_data: itinerary,
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

  const addStep = () => {
    setItinerary((prev) => [...prev, { id: crypto.randomUUID(), title: '', done: false }])
  }

  const updateStep = (stepId: string, patch: Partial<ItineraryStep>) => {
    setItinerary((prev) => prev.map((s) => (s.id === stepId ? { ...s, ...patch } : s)))
  }

  const removeStep = (stepId: string) => {
    setItinerary((prev) => prev.filter((s) => s.id !== stepId))
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-8">
        <div className="container px-4 max-w-6xl">
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-yellow-400" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-yellow-400">Caderno Virtual</h1>
              <p className="text-slate-300 text-sm mt-1">Suas anotações e itinerário de estudo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 max-w-6xl py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-3">
            <Button onClick={handleNewNote} className="w-full" variant="default">
              <Plus className="w-4 h-4 mr-2" /> Nova Nota
            </Button>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Nenhuma nota ainda. Crie sua primeira!
                </p>
              ) : (
                notes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedId(n.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      selectedId === n.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    )}
                  >
                    <p className="font-medium text-sm text-slate-800 truncate">
                      {n.title || 'Sem título'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(n.updated)}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <Input
                  placeholder="Título da nota..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold border-none px-0 focus-visible:ring-0"
                />
                <div className="flex gap-2 shrink-0">
                  {selectedId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDelete}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>

              <Textarea
                placeholder="Escreva suas anotações aqui..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[240px] resize-y"
              />

              <div className="border-t pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800">Itinerário de Estudo</h3>
                  <Button variant="outline" size="sm" onClick={addStep}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Etapa
                  </Button>
                </div>
                {itinerary.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">
                    Nenhuma etapa ainda. Adicione passos para planejar seus estudos.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {itinerary.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border"
                      >
                        <button
                          onClick={() => updateStep(step.id, { done: !step.done })}
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                            step.done
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-slate-300 hover:border-emerald-400',
                          )}
                        >
                          {step.done && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <Input
                          value={step.title}
                          onChange={(e) => updateStep(step.id, { title: e.target.value })}
                          placeholder="Descrição da etapa..."
                          className={cn(
                            'h-9 border-none bg-transparent focus-visible:ring-0',
                            step.done && 'line-through text-slate-400',
                          )}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-500"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
