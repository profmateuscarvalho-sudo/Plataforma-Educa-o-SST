import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getCases, createCase, getLikesForCases, toggleLike } from '@/services/professional-cases'
import { ProfessionalCase } from '@/types'
import { CaseDetailModal } from '@/components/student/CaseDetailModal'
import { Heart, MessageCircle, MessageSquare, Briefcase, Plus } from 'lucide-react'
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
import '@/styles/3d-effects.css'

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
      /* intentionally ignored */
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
      const n = new Set(prev)
      wasLiked ? n.delete(caseId) : n.add(caseId)
      return n
    })
    setLikeCounts((prev) => ({
      ...prev,
      [caseId]: Math.max(0, (prev[caseId] || 0) + (wasLiked ? -1 : 1)),
    }))
    try {
      await toggleLike(caseId, user.id)
    } catch {
      setLikedCases((prev) => {
        const n = new Set(prev)
        wasLiked ? n.add(caseId) : n.delete(caseId)
        return n
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
      /* intentionally ignored */
    } finally {
      setSaving(false)
    }
  }

  const renderAvatar = (u: any) =>
    u?.avatar ? (
      <img
        src={pb.files.getUrl(u, u.avatar)}
        alt={u.name}
        className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-md"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-white shadow-md">
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
      <div className="rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden flex flex-col h-full shadow-sm">
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
              const author = c.expand?.user
              const tags = author?.professional_tags || []
              return (
                <div
                  key={c.id}
                  className="social-card p-4 rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {renderAvatar(author)}
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-800 block truncate">
                        {author?.name || 'Anônimo'}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tags.slice(0, 2).map((t: string) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100"
                          >
                            <Briefcase className="w-2 h-2" />
                            {t}
                          </span>
                        ))}
                        <span className="text-xs text-slate-400">{formatDate(c.created)}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCaseId(c.id)} className="w-full text-left">
                    <p className="text-base font-bold text-slate-900 mb-1.5">{c.title}</p>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-3">
                      {stripHtml(c.content) || c.content}
                    </p>
                  </button>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleLike(c.id)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 text-sm font-semibold transition-all flex-1 py-1.5 rounded-xl',
                        isLiked
                          ? 'text-red-600 bg-red-50'
                          : 'text-slate-500 hover:text-red-500 hover:bg-red-50',
                      )}
                    >
                      <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} /> Curtir{' '}
                      {likeCount > 0 && `(${likeCount})`}
                    </button>
                    <button
                      onClick={() => setSelectedCaseId(c.id)}
                      className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-emerald-600 flex-1 py-1.5 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" /> Comentar
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white btn-3d"
            >
              <Plus className="w-4 h-4 mr-2" /> {saving ? 'Publicando...' : 'Publicar Case'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CaseDetailModal caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />
    </>
  )
}
