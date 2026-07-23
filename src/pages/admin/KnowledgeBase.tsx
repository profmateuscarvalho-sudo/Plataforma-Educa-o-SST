import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Link2,
  Type,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  getKnowledgeEntries,
  deleteKnowledgeEntry,
  reprocessKnowledgeEntry,
} from '@/services/knowledge'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { KnowledgeEntryModal } from '@/components/admin/KnowledgeEntryModal'
import pb from '@/lib/pocketbase/client'
import type { KnowledgeEntry } from '@/types'

const TYPE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  link: Link2,
  free_text: Type,
}

export default function AdminKnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<KnowledgeEntry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [reprocessingId, setReprocessingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      const data = await getKnowledgeEntries()
      setEntries(data)
    } catch {
      /* ignored */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('knowledge_entries', () => {
    load()
  })

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteKnowledgeEntry(deleteId)
      toast({ title: 'Entrada excluída' })
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
    setDeleteId(null)
  }

  const handleReprocess = async (id: string) => {
    setReprocessingId(id)
    try {
      await reprocessKnowledgeEntry(id)
      toast({ title: 'Reprocessando entrada...' })
      load()
    } catch {
      toast({ title: 'Erro ao reprocessar', variant: 'destructive' })
    }
    setReprocessingId(null)
  }

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'processing')
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Processando
        </Badge>
      )
    if (status === 'completed')
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Concluído
        </Badge>
      )
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-700">
        <XCircle className="w-3 h-3 mr-1" />
        Falhou
      </Badge>
    )
  }

  const stats = {
    total: entries.length,
    completed: entries.filter((e) => e.status === 'completed').length,
    processing: entries.filter((e) => e.status === 'processing').length,
    failed: entries.filter((e) => e.status === 'failed').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Base de Conhecimento</h2>
          <p className="text-slate-500 text-sm">
            Gerencie materiais de referência para os agentes IA.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus className="mr-2 w-4 h-4" /> Nova Entrada
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', val: stats.total, color: 'text-slate-700' },
          { label: 'Concluídas', val: stats.completed, color: 'text-green-600' },
          { label: 'Processando', val: stats.processing, color: 'text-blue-600' },
          { label: 'Falharam', val: stats.failed, color: 'text-red-600' },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {loading && <div className="p-8 text-center text-slate-500">Carregando...</div>}
          {!loading && entries.length === 0 && (
            <div className="p-8 text-center text-slate-500">Nenhuma entrada cadastrada.</div>
          )}
          {entries.map((entry) => {
            const Icon = TYPE_ICONS[entry.type] || FileText
            const fileUrl = entry.file ? pb.files.getUrl(entry, entry.file) : null
            return (
              <div key={entry.id} className="p-4 hover:bg-slate-50">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                      <p className="font-bold truncate">{entry.title}</p>
                      <StatusBadge status={entry.status} />
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {entry.tags?.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(entry.created).toLocaleString('pt-BR')}
                    </p>
                    {entry.status === 'failed' && entry.error_message && (
                      <p className="text-xs text-red-500 mt-1">{entry.error_message}</p>
                    )}
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        Ver arquivo
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(entry)
                        setModalOpen(true)
                      }}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {entry.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReprocess(entry.id)}
                        disabled={reprocessingId === entry.id}
                        title="Reprocessar"
                      >
                        {reprocessingId === entry.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() => setDeleteId(entry.id)}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <KnowledgeEntryModal
        open={modalOpen}
        setOpen={setModalOpen}
        editing={editing}
        onSuccess={load}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a entrada, todos os chunks associados e o arquivo. Não pode ser
              desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
