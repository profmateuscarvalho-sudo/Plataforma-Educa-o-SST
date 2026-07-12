import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getCases, createCase } from '@/services/professional-cases'
import { ProfessionalCase } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { BackToHub } from '@/components/student/BackToHub'
import { CaseDetailModal } from '@/components/student/CaseDetailModal'
import { MessagesSquare, Plus, MessageCircle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml } from '@/lib/utils'

export default function StudentCaseFeed() {
  const { user } = useAuth()
  const [cases, setCases] = useState<ProfessionalCase[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)

  const loadCases = useCallback(async () => {
    try {
      const list = await getCases()
      setCases(list)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadCases()
  }, [loadCases])

  useRealtime('professional_cases', () => loadCases())

  const handleCreate = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return
    setSaving(true)
    try {
      await createCase({ user: user.id, title: newTitle.trim(), content: newContent.trim() })
      setNewTitle('')
      setNewContent('')
      setShowCreate(false)
      await loadCases()
    } catch {
      /* ignore */
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  const renderAvatar = (u: any) =>
    u?.avatar ? (
      <img
        src={pb.files.getUrl(u, u.avatar)}
        alt={u.name}
        className="w-9 h-9 rounded-full object-cover"
      />
    ) : (
      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
        {u?.name?.charAt(0).toUpperCase() || '?'}
      </div>
    )

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50">
      <div className="bg-gradient-to-br from-teal-700 via-emerald-800 to-teal-900 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <MessagesSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">Feed de Cases</h1>
              <p className="text-emerald-100/70 text-sm">
                Compartilhe e discuta casos profissionais
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-white text-emerald-800 hover:bg-emerald-50 border-none"
            >
              <Plus className="w-4 h-4 mr-2" /> Compartilhar Case
            </Button>
            <BackToHub />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        {cases.length === 0 ? (
          <div className="text-center py-20">
            <MessagesSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum case compartilhado ainda.</p>
            <p className="text-slate-400 text-sm mt-1">Seja o primeiro a compartilhar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className="text-left bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <h3 className="font-serif font-bold text-slate-800 mb-2 line-clamp-2">{c.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-3 mb-4">
                  {stripHtml(c.content) || c.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {renderAvatar(c.expand?.user)}
                    <div>
                      <p className="text-xs font-medium text-slate-600">
                        {c.expand?.user?.name || 'Anônimo'}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(c.created)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Compartilhar Case</DialogTitle>
            <DialogDescription>
              Descreva uma situação profissional para discussão.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Título</label>
              <Input
                placeholder="Ex: Risco químico em indústria..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Descrição do caso
              </label>
              <Textarea
                placeholder="Descreva a situação profissional..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={saving || !newTitle.trim() || !newContent.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Publicando...' : 'Publicar Case'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CaseDetailModal caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />
    </div>
  )
}
