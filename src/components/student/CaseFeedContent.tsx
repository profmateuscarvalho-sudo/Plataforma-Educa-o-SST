import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getCases, createCase, getLikesForCases, toggleLike } from '@/services/professional-cases'
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
import { CaseDetailModal } from '@/components/student/CaseDetailModal'
import { MessagesSquare, Plus, MessageCircle, Heart } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml, cn } from '@/lib/utils'

export function CaseFeedContent() {
  const { user } = useAuth()
  const [cases, setCases] = useState<ProfessionalCase[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [likedCases, setLikedCases] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    try {
      const list = await getCases()
      setCases(list)
      const ids = list.map((c) => c.id)
      if (ids.length > 0) {
        const likes = await getLikesForCases(ids)
        const counts: Record<string, number> = {}
        const userLiked = new Set<string>()
        for (const l of likes) {
          counts[l.case] = (counts[l.case] || 0) + 1
          if (l.user === user?.id) userLiked.add(l.case)
        }
        setLikeCounts(counts)
        setLikedCases(userLiked)
      }
    } catch {
      /* ignore */
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('professional_cases', () => loadData())
  useRealtime('case_likes', () => loadData())

  const handleCreate = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return
    setSaving(true)
    try {
      await createCase({ user: user.id, title: newTitle.trim(), content: newContent.trim() })
      setNewTitle('')
      setNewContent('')
      setShowCreate(false)
      await loadData()
    } catch {
      /* ignore */
    } finally {
      setSaving(false)
    }
  }

  const handleLike = async (caseId: string) => {
    if (!user) return
    const wasLiked = likedCases.has(caseId)
    setLikedCases((prev) => {
      const next = new Set(prev)
      if (wasLiked) next.delete(caseId)
      else next.add(caseId)
      return next
    })
    setLikeCounts((prev) => ({
      ...prev,
      [caseId]: Math.max(0, (prev[caseId] || 0) + (wasLiked ? -1 : 1)),
    }))
    try {
      await toggleLike(caseId, user.id)
    } catch {
      setLikedCases((prev) => {
        const next = new Set(prev)
        if (wasLiked) next.add(caseId)
        else next.delete(caseId)
        return next
      })
      setLikeCounts((prev) => ({
        ...prev,
        [caseId]: Math.max(0, (prev[caseId] || 0) + (wasLiked ? 1 : -1)),
      }))
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
      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
        {u?.name?.charAt(0).toUpperCase() || '?'}
      </div>
    )

  return (
    <div className="flex flex-col h-full bg-white/50 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessagesSquare className="w-5 h-5 text-emerald-600" /> Casos Profissionais
          </h2>
          <p className="text-sm text-slate-500">Compartilhe e discuta experiências</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Case
        </Button>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <MessagesSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum case compartilhado ainda.</p>
          <p className="text-slate-400 text-sm mt-1">Seja o primeiro a compartilhar!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
          {cases.map((c) => {
            const isLiked = likedCases.has(c.id)
            const likeCount = likeCounts[c.id] || 0
            return (
              <div
                key={c.id}
                className="text-left bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col h-full"
              >
                <button onClick={() => setSelectedCaseId(c.id)} className="text-left flex-1">
                  <h3 className="font-serif font-bold text-slate-800 mb-2 line-clamp-2">
                    {c.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-3 mb-4">
                    {stripHtml(c.content) || c.content}
                  </p>
                </button>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 w-full mt-auto">
                  <div className="flex items-center gap-2">
                    {renderAvatar(c.expand?.user)}
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-slate-600 truncate max-w-[120px]">
                        {c.expand?.user?.name || 'Anônimo'}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(c.created)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleLike(c.id)}
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors',
                        isLiked
                          ? 'text-red-600 bg-red-50'
                          : 'text-slate-400 hover:text-red-500 hover:bg-red-50',
                      )}
                    >
                      <Heart className={cn('w-3.5 h-3.5', isLiked && 'fill-current')} />
                      {likeCount > 0 && likeCount}
                    </button>
                    <button
                      onClick={() => setSelectedCaseId(c.id)}
                      className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Ver
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
