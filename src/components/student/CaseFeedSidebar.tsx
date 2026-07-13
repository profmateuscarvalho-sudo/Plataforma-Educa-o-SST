import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getCases, createCase, getLikesForCases, toggleLike } from '@/services/professional-cases'
import { ProfessionalCase } from '@/types'
import { CaseDetailModal } from '@/components/student/CaseDetailModal'
import { Heart, MessageCircle, MessageSquare } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function CaseFeedSidebar() {
  const { user } = useAuth()
  const [cases, setCases] = useState<ProfessionalCase[]>([])
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [likedCases, setLikedCases] = useState<Set<string>>(new Set())
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)

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

  const renderAvatar = (u: any) =>
    u?.avatar ? (
      <img
        src={pb.files.getUrl(u, u.avatar)}
        alt={u.name}
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0 border border-emerald-200">
        {u?.name?.charAt(0).toUpperCase() || '?'}
      </div>
    )

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex flex-col h-full shadow-sm">
        <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">Feed de Cases</h3>
          </div>
        </div>

        <div className="p-4 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
          <div
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 transition-colors p-3 rounded-full cursor-pointer border border-slate-200"
          >
            {renderAvatar(user)}
            <span className="text-slate-500 font-medium">Compartilhe um caso profissional...</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cases.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Nenhum caso compartilhado.</p>
          ) : (
            cases.map((c) => {
              const isLiked = likedCases.has(c.id)
              const likeCount = likeCounts[c.id] || 0
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {renderAvatar(c.expand?.user)}
                    <div>
                      <span className="text-sm font-bold text-slate-800 block">
                        {c.expand?.user?.name || 'Anônimo'}
                      </span>
                      <span className="text-xs text-slate-500 block">{formatDate(c.created)}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCaseId(c.id)} className="w-full text-left">
                    <p className="text-base font-bold text-slate-900 mb-1.5">{c.title}</p>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-3">
                      {stripHtml(c.content) || c.content}
                    </p>
                  </button>
                  <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleLike(c.id)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 text-sm font-medium transition-colors flex-1 py-1.5 rounded-lg hover:bg-slate-50',
                        isLiked ? 'text-red-600' : 'text-slate-500 hover:text-red-500',
                      )}
                    >
                      <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
                      Curtir {likeCount > 0 && `(${likeCount})`}
                    </button>
                    <button
                      onClick={() => setSelectedCaseId(c.id)}
                      className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600 flex-1 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Comentar
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
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
    </>
  )
}
