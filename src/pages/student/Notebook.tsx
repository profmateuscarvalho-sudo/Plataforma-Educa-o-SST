import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getStudentNotes,
  createStudentNote,
  updateStudentNote,
  deleteStudentNote,
  setNotePublic,
  getSharedNotes,
} from '@/services/student-notes'
import { StudentNote, MindMapData, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BackToHub } from '@/components/student/BackToHub'
import { MindMapEditor } from '@/components/student/MindMapEditor'
import { NewsSidebar } from '@/components/student/NewsSidebar'
import { RichTextEditor } from '@/components/RichTextEditor'
import {
  Plus,
  Trash2,
  Save,
  Notebook,
  FileText,
  Share2,
  Network,
  Globe,
  Eye,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import pb from '@/lib/pocketbase/client'
import '@/styles/3d-effects.css'

const emptyMindMap: MindMapData = { nodes: [], connections: [] }

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export default function StudentNotebook() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mindMap, setMindMap] = useState<MindMapData>(emptyMindMap)
  const [saving, setSaving] = useState(false)
  const [sharingId, setSharingId] = useState<string | null>(null)
  const [sharedNotes, setSharedNotes] = useState<StudentNote[]>([])
  const [viewingShared, setViewingShared] = useState<StudentNote | null>(null)
  const [tab, setTab] = useState('minhas')

  useTrackAccess('Caderno Virtual')

  const loadNotes = useCallback(async () => {
    if (!user) return
    try {
      setNotes(await getStudentNotes(user.id))
    } catch {
      /* intentionally ignored */
    }
  }, [user])

  const loadShared = useCallback(async () => {
    try {
      setSharedNotes(await getSharedNotes())
    } catch {
      /* intentionally ignored */
    }
  }, [])

  useEffect(() => {
    loadNotes()
    loadShared()
  }, [loadNotes, loadShared])
  useRealtime('student_notes', () => {
    loadNotes()
    loadShared()
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

  const handleToggleShare = async (noteId: string, makePublic: boolean) => {
    setSharingId(noteId)
    try {
      await setNotePublic(noteId, makePublic)
      await loadNotes()
      await loadShared()
      toast({
        title: makePublic ? 'Nota compartilhada publicamente!' : 'Compartilhamento desativado.',
      })
    } catch {
      toast({ title: 'Erro ao alterar compartilhamento.', variant: 'destructive' })
    } finally {
      setSharingId(null)
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
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 text-slate-800">
      <div className="notebook-glass border-b border-white/40 py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center icon-3d">
              <Notebook className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-800">Caderno Virtual</h1>
              <p className="text-slate-500 text-sm">Suas anotações, mapas mentais e comunidade</p>
            </div>
          </div>
          <BackToHub className="bg-white/60 hover:bg-white/80 text-slate-700 hover:text-slate-900 border border-white/50 backdrop-blur" />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-white/60 backdrop-blur border border-white/50 mb-4">
            <TabsTrigger value="minhas" className="gap-2">
              <Notebook className="w-4 h-4" /> Minhas Notas
            </TabsTrigger>
            <TabsTrigger value="compartilhadas" className="gap-2">
              <Globe className="w-4 h-4" /> Notas Compartilhadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="minhas">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
                <div className="space-y-3">
                  <Button
                    onClick={handleNewNote}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-3d btn-3d border-0"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Nova Nota
                  </Button>
                  <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
                    {notes.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">Nenhuma nota ainda.</p>
                    ) : (
                      notes.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'w-full text-left p-3 rounded-xl border transition-all cursor-pointer',
                            selectedId === n.id
                              ? 'border-blue-500 bg-blue-50 shadow-3d'
                              : 'border-white/40 bg-white/50 hover:border-blue-300 hover:shadow-3d backdrop-blur',
                          )}
                          onClick={() => setSelectedId(n.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm text-slate-800 truncate flex-1">
                              {n.title || 'Sem título'}
                            </p>
                            {n.is_public && (
                              <span
                                title="Compartilhada publicamente"
                                className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600"
                              >
                                <Globe className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{formatDate(n.updated)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="notebook-glass rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
                  <Tabs defaultValue="texto" className="flex flex-col flex-1 h-full">
                    <div className="flex items-center justify-between gap-3 p-3 border-b border-white/30 bg-white/30">
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
                            size="sm"
                            disabled={sharingId === selectedId}
                            onClick={() => handleToggleShare(selectedId, !selected?.is_public)}
                            className={cn(
                              'icon-3d border',
                              selected?.is_public
                                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200',
                            )}
                            title={
                              selected?.is_public
                                ? 'Desativar compartilhamento'
                                : 'Compartilhar publicamente'
                            }
                          >
                            {sharingId === selectedId ? (
                              '...'
                            ) : (
                              <>
                                <Share2 className="w-4 h-4 mr-1.5" />
                                {selected?.is_public ? 'Compartilhada' : 'Compartilhar'}
                              </>
                            )}
                          </Button>
                        )}
                        {selectedId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 icon-3d"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white btn-3d border-0"
                          title="Salvar"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </div>

                    <div className="border-b border-white/30 px-4 bg-white/20">
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
                          <Network className="w-4 h-4 mr-2" /> Mapa Mental
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="texto" className="flex-1 m-0 p-4">
                      <RichTextEditor value={content} onChange={setContent} />
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
          </TabsContent>

          <TabsContent value="compartilhadas">
            <SharedNotesList
              notes={sharedNotes}
              currentUserId={user?.id}
              onView={setViewingShared}
            />
          </TabsContent>
        </Tabs>
      </div>

      {viewingShared && (
        <SharedNoteModal note={viewingShared} onClose={() => setViewingShared(null)} />
      )}
    </div>
  )
}

function SharedNotesList({
  notes,
  currentUserId,
  onView,
}: {
  notes: StudentNote[]
  currentUserId?: string
  onView: (n: StudentNote) => void
}) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-24">
        <Globe className="w-14 h-14 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700">Nenhuma nota compartilhada ainda</h3>
        <p className="text-slate-500 mt-2 text-sm">
          Compartilhe uma de suas notas para que outros alunos possam se inspirar.
        </p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {notes.map((n) => {
        const author = n.expand?.user as User | undefined
        const preview = stripHtml(n.content || '')
        return (
          <div
            key={n.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="w-8 h-8">
                {author?.avatar ? (
                  <AvatarImage src={pb.files.getUrl(author, author.avatar)} alt={author.name} />
                ) : null}
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                  {author?.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {author?.name || 'Aluno'}
                </p>
                {n.shared_at && (
                  <p className="text-xs text-slate-400">{formatDateShort(n.shared_at)}</p>
                )}
              </div>
            </div>
            <h3 className="font-serif font-bold text-slate-800 line-clamp-2 mb-2">
              {n.title || 'Sem título'}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-4 flex-1">
              {preview || 'Sem conteúdo textual.'}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              {currentUserId === n.user ? (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Sua nota
                </span>
              ) : (
                <span className="text-xs text-slate-400">Nota pública</span>
              )}
              <Button size="sm" variant="outline" onClick={() => onView(n)} className="group/btn">
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Ler
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SharedNoteModal({ note, onClose }: { note: StudentNote; onClose: () => void }) {
  const author = note.expand?.user as User | undefined
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-bold text-slate-800 line-clamp-2">
              {note.title || 'Sem título'}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="w-6 h-6">
                {author?.avatar ? (
                  <AvatarImage src={pb.files.getUrl(author, author.avatar)} alt={author.name} />
                ) : null}
                <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-bold">
                  {author?.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-500">{author?.name || 'Aluno'}</span>
              {note.shared_at && (
                <span className="text-xs text-slate-400">· {formatDateShort(note.shared_at)}</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div
          className="p-6 overflow-y-auto prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: note.content || '<p>Sem conteúdo.</p>' }}
        />
      </div>
    </div>
  )
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
