import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useTrackAccess } from '@/hooks/use-track-access'
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
    <div className="min-h-[calc(100vh-56px)] bg-background text-foreground">
      <div className="border-b border-border bg-card py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[18px] bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Notebook className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">
                Caderno Virtual
              </h1>
              <p className="text-muted-foreground text-sm">
                Suas anotações, mapas mentais e comunidade
              </p>
            </div>
          </div>
          <BackToHub className="border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-muted rounded-full min-h-[44px] px-5" />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-muted p-1 rounded-full mb-6">
            <TabsTrigger
              value="minhas"
              className="rounded-full px-5 gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Notebook className="w-4 h-4" /> Minhas Notas
            </TabsTrigger>
            <TabsTrigger
              value="compartilhadas"
              className="rounded-full px-5 gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Globe className="w-4 h-4" /> Notas Compartilhadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="minhas">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
                <div className="space-y-3">
                  <Button
                    onClick={handleNewNote}
                    className="w-full min-h-[52px] rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Nova Nota
                  </Button>
                  <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                    {notes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma nota ainda.
                      </p>
                    ) : (
                      notes.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'w-full text-left p-3.5 rounded-[20px] border transition-all cursor-pointer',
                            selectedId === n.id
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border bg-card hover:border-foreground/30 text-card-foreground',
                          )}
                          onClick={() => setSelectedId(n.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-sm truncate flex-1 font-serif">
                              {n.title || 'Sem título'}
                            </p>
                            {n.is_public && (
                              <span
                                title="Compartilhada publicamente"
                                className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E3F1E9] text-[#1F6B4A] dark:bg-[#1F6B4A]/30 dark:text-[#E3F1E9]"
                              >
                                <Globe className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(n.updated)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-card text-card-foreground rounded-[28px] border border-border overflow-hidden flex flex-col min-h-[600px]">
                  <Tabs defaultValue="texto" className="flex flex-col flex-1 h-full">
                    <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-muted/30">
                      <Input
                        placeholder="Título da nota..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-serif font-semibold border-none bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 px-2"
                      />
                      <div className="flex gap-2 shrink-0 items-center">
                        {selectedId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={sharingId === selectedId}
                            onClick={() => handleToggleShare(selectedId, !selected?.is_public)}
                            className={cn(
                              'rounded-full min-h-[44px] px-4 border text-xs font-semibold',
                              selected?.is_public
                                ? 'text-[#1F6B4A] dark:text-[#E3F1E9] bg-[#E3F1E9] dark:bg-[#1F6B4A]/20 border-[#1F6B4A]/30'
                                : 'text-foreground border-border hover:bg-muted',
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
                            className="text-[#B4472E] hover:bg-[#FAE7E1]/30 rounded-full w-11 h-11"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="min-h-[44px] px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          title="Salvar"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </div>

                    <div className="border-b border-border px-4 bg-card">
                      <TabsList className="bg-transparent border-none p-0 h-12 w-full justify-start gap-4">
                        <TabsTrigger
                          value="texto"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-2 text-muted-foreground font-semibold"
                        >
                          <FileText className="w-4 h-4 mr-2" /> Texto
                        </TabsTrigger>
                        <TabsTrigger
                          value="mapa"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-2 text-muted-foreground font-semibold"
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
      <div className="text-center py-24 bg-card text-card-foreground rounded-[28px] border border-border">
        <Globe className="w-14 h-14 mx-auto text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-serif font-semibold text-foreground">
          Nenhuma nota compartilhada ainda
        </h3>
        <p className="text-muted-foreground mt-2 text-sm">
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
            className="bg-card text-card-foreground rounded-[28px] border border-border p-6 flex flex-col hover:border-foreground/30 transition-all group"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <Avatar className="w-8 h-8">
                {author?.avatar ? (
                  <AvatarImage src={pb.files.getUrl(author, author.avatar)} alt={author.name} />
                ) : null}
                <AvatarFallback className="bg-primary/20 text-foreground text-xs font-bold">
                  {author?.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {author?.name || 'Aluno'}
                </p>
                {n.shared_at && (
                  <p className="text-xs text-muted-foreground">{formatDateShort(n.shared_at)}</p>
                )}
              </div>
            </div>
            <h3 className="font-serif font-semibold text-foreground line-clamp-2 mb-2 text-base">
              {n.title || 'Sem título'}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-4 flex-1 leading-relaxed">
              {preview || 'Sem conteúdo textual.'}
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              {currentUserId === n.user ? (
                <span className="text-xs font-semibold text-[#1F6B4A] dark:text-[#E3F1E9] flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Sua nota
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Nota pública</span>
              )}
              <Button
                variant="outline"
                onClick={() => onView(n)}
                className="rounded-full min-h-[44px] px-5 border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-muted"
              >
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card text-card-foreground rounded-[28px] max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-6 border-b border-border">
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-semibold text-foreground line-clamp-2">
              {note.title || 'Sem título'}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="w-6 h-6">
                {author?.avatar ? (
                  <AvatarImage src={pb.files.getUrl(author, author.avatar)} alt={author.name} />
                ) : null}
                <AvatarFallback className="bg-primary/20 text-foreground text-[10px] font-bold">
                  {author?.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{author?.name || 'Aluno'}</span>
              {note.shared_at && (
                <span className="text-xs text-muted-foreground">
                  · {formatDateShort(note.shared_at)}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div
          className="p-6 overflow-y-auto prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
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
