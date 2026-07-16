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
import { MessagesSquare, Plus, MessageCircle, Heart, Clock, Briefcase } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml, cn } from '@/lib/utils'
import '@/styles/3d-effects.css'

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
      /* intentionally ignored */
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
    } catch {
      /* intentionally ignored */
    } finally {
      setSaving(false)
    }
  }

  const handleLike = async (caseId: string) => {
    if (!user) return
    const wasLiked = likedCases.has(caseId)
    setLikedCases((prev) => {
      const n = new Set(prev)
      if (wasLiked) {
        n.delete(caseId)
      } else {
        n.add(caseId)
      }
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
        if (wasLiked) {
          n.add(caseId)
        } else {
          n.delete(caseId)
        }
        return n
      })
      setLikeCounts((prev) => ({
        ...prev,
        [caseId]: Math.max(0, (prev[caseId] || 0) + (wasLiked ? 1 : -1)),
      }))
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  const renderAvatar = (u: any, size = 'w-11 h-11') =>
    u?.avatar ? (
      <img
        src={pb.files.getUrl(u, u.avatar)}
        alt={u.name}
        className={`${size} rounded-full object-cover ring-2 ring-white shadow-md`}
      />
    ) : (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white`}
      >
        {u?.name?.charAt(0).toUpperCase() || '?'}
      </div>
    )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessagesSquare className="w-5 h-5 text-emerald-600" /> Casos Profissionais
          </h2>
          <p className="text-sm text-slate-500">Compartilhe e discuta experiências em SST</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white btn-3d"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Case
        </Button>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <MessagesSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum case aprovado ainda.</p>
        </div>
      ) : (
        <div className="space-y-5 pb-8 max-w-2xl mx-auto w-full">
          {cases.map((c) => {
            const isLiked = likedCases.has(c.id)
            const likeCount = likeCounts[c.id] || 0
            const author = c.expand?.user
            const tags = author?.professional_tags || []
            return (
              <div
                key={c.id}
                className="social-card bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4 pb-3">
                  {renderAvatar(author)}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{author?.name || 'Anônimo'}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {tags.slice(0, 3).map((t: string) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100"
                        >
                          <Briefcase className="w-2.5 h-2.5" />
                          {t}
                        </span>
                      ))}
                      <span className="text-xs text-slate-400">{formatDate(c.created)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCaseId(c.id)}
                  className="block w-full text-left px-4 pb-3"
                >
                  <h3 className="font-serif font-bold text-lg text-slate-900 mb-1.5 line-clamp-2">
                    {c.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-4">
                    {stripHtml(c.content) || c.content}
                  </p>
                </button>
                <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => handleLike(c.id)}
                    className={cn(
                      'flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full transition-all',
                      isLiked
                        ? 'text-red-600 bg-red-50'
                        : 'text-slate-500 hover:text-red-500 hover:bg-red-50',
                    )}
                  >
                    <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
                    {likeCount > 0 && <span>{likeCount}</span>}
                    <span>Curtir</span>
                  </button>
                  <button
                    onClick={() => setSelectedCaseId(c.id)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-emerald-600 px-3 py-1.5 rounded-full hover:bg-emerald-50 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" /> Comentar
                  </button>
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
              Descreva uma situação profissional para discussão. Seu case será revisado antes de
              aparecer no feed.
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
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" /> Seu case será revisado antes da publicação
            </div>
            <Button
              onClick={handleCreate}
              disabled={saving || !newTitle.trim() || !newContent.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white btn-3d"
            >
              {saving ? 'Enviando...' : 'Enviar para Moderação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CaseDetailModal caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />
    </div>
  )
}
