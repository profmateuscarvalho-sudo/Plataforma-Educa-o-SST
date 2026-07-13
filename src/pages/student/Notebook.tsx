import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getStudentNotes,
  createStudentNote,
  updateStudentNote,
  deleteStudentNote,
} from '@/services/student-notes'
import { StudentNote, MindMapData } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BackToHub } from '@/components/student/BackToHub'
import { MindMapEditor } from '@/components/student/MindMapEditor'
import { NewsSidebar } from '@/components/student/NewsSidebar'
import { CaseFeedContent } from '@/components/student/CaseFeedContent'
import { CaseFeedSidebar } from '@/components/student/CaseFeedSidebar'
import { Plus, Trash2, Save, Notebook, FileText, Share2, Briefcase } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const emptyMindMap: MindMapData = { nodes: [], connections: [] }

export default function StudentNotebook() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mindMap, setMindMap] = useState<MindMapData>(emptyMindMap)
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
      const raw = selected.itinerary_data as any
      setMindMap(raw && Array.isArray(raw?.nodes) ? (raw as MindMapData) : emptyMindMap)
    } else {
      setTitle('')
      setContent('')
      setMindMap(emptyMindMap)
    }
  }, [selectedId, notes])

  const handleNewNote = () => {
    setSelectedId(null)
    setTitle('')
    setContent('')
    setMindMap(emptyMindMap)
  }

  const handleSave = async () => {
    if (!user) return
    if (!title.trim() && !content.trim() && mindMap.nodes.length === 0) {
      toast({ title: 'Adicione um título ou conteúdo.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        user: user.id,
        title: title.trim() || 'Sem título',
        content,
        itinerary_data: mindMap,
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
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 text-slate-800">
      <div className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Notebook className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-800">Caderno Virtual</h1>
              <p className="text-slate-500 text-sm">Suas anotações, mapas mentais e comunidade</p>
            </div>
          </div>
          <BackToHub className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200" />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr_280px] gap-6">
          <div className="hidden xl:block h-[calc(100vh-140px)] sticky top-[88px]">
            <CaseFeedSidebar />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
            <div className="space-y-3">
              <Button
                onClick={handleNewNote}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Nova Nota
              </Button>
              <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
                {notes.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Nenhuma nota ainda.</p>
                ) : (
                  notes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedId(n.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-all',
                        selectedId === n.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-blue-300',
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

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-sm min-h-[600px]">
              <Tabs defaultValue="texto" className="flex flex-col flex-1 h-full">
                <div className="flex items-center justify-between gap-3 p-3 border-b border-slate-200 bg-slate-50/50">
                  <Input
                    placeholder="Título da nota..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg font-semibold border-none bg-transparent text-slate-800 placeholder:text-slate-400 focus-visible:ring-0 px-2"
                  />
                  <div className="flex gap-2 shrink-0">
                    {selectedId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-slate-800 hover:bg-slate-900 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>

                <div className="border-b border-slate-200 px-4 bg-white">
                  <TabsList className="bg-transparent border-none p-0 h-12 w-full justify-start gap-4">
                    <TabsTrigger
                      value="texto"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-2 text-slate-600"
                    >
                      <FileText className="w-4 h-4 mr-2" /> Texto
                    </TabsTrigger>
                    <TabsTrigger
                      value="mapa"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-2 text-slate-600"
                    >
                      <Share2 className="w-4 h-4 mr-2" /> Mapa Mental
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="texto" className="flex-1 m-0 p-4">
                  <Textarea
                    placeholder="Escreva suas anotações aqui..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full min-h-[450px] resize-none border-none bg-transparent text-slate-700 placeholder:text-slate-400 focus-visible:ring-0 rounded-none"
                  />
                </TabsContent>
                <TabsContent value="mapa" className="flex-1 m-0 p-0 flex flex-col">
                  <MindMapEditor data={mindMap} onChange={setMindMap} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <div className="hidden xl:block">
            <NewsSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}
