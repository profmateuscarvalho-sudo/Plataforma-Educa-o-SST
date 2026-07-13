import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getCase,
  getComments,
  createComment,
  getLikesForCases,
  toggleLike,
} from '@/services/professional-cases'
import { ProfessionalCase, CaseComment } from '@/types'
import { Send, MessageCircle, Heart } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml, cn } from '@/lib/utils'

interface CaseDetailModalProps {
  caseId: string | null
  onClose: () => void
}

export function CaseDetailModal({ caseId, onClose }: CaseDetailModalProps) {
  const { user } = useAuth()
  const [caseData, setCaseData] = useState<ProfessionalCase | null>(null)
  const [comments, setComments] = useState<CaseComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  const loadData = useCallback(async () => {
    if (!caseId) return
    try {
      const c = await getCase(caseId)
      setCaseData(c)
      const comms = await getComments(caseId)
      setComments(comms)
      const likes = await getLikesForCases([caseId])
      setLikeCount(likes.length)
      setIsLiked(likes.some((l) => l.user === user?.id))
    } catch {
      /* ignore */
    }
  }, [caseId, user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('case_comments', () => {
    if (caseId) loadData()
  })

  useRealtime('case_likes', () => {
    if (caseId) loadData()
  })

  const handleLike = async () => {
    if (!user || !caseId) return
    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setLikeCount((prev) => Math.max(0, prev + (wasLiked ? -1 : 1)))
    try {
      await toggleLike(caseId, user.id)
    } catch {
      setIsLiked(wasLiked)
      setLikeCount((prev) => Math.max(0, prev + (wasLiked ? 1 : -1)))
    }
  }

  const handleComment = async () => {
    if (!user || !caseId || !newComment.trim()) return
    setLoading(true)
    try {
      await createComment({ case: caseId, user: user.id, content: newComment.trim() })
      setNewComment('')
      await loadData()
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  const renderAvatar = (u: any, size = 'w-8 h-8') =>
    u?.avatar ? (
      <img
        src={pb.files.getUrl(u, u.avatar)}
        alt={u.name}
        className={`${size} rounded-full object-cover`}
      />
    ) : (
      <div
        className={`${size} rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs`}
      >
        {u?.name?.charAt(0).toUpperCase() || '?'}
      </div>
    )

  return (
    <Dialog open={!!caseId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">{caseData?.title}</DialogTitle>
        {caseData ? (
          <>
            <div className="p-5 border-b">
              <h2 className="text-xl font-serif font-bold text-slate-800 mb-3">{caseData.title}</h2>
              <div className="flex items-center gap-2">
                {renderAvatar(caseData.expand?.user)}
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {caseData.expand?.user?.name || 'Anônimo'}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(caseData.created)}</p>
                </div>
              </div>
              <div
                className="mt-4 text-sm text-slate-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: stripHtml(caseData.content)
                    ? caseData.content
                    : `<p>${caseData.content}</p>`,
                }}
              />
            </div>
            <div className="px-5 py-2 border-b flex items-center gap-4">
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-1.5 text-sm transition-colors',
                  isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400',
                )}
              >
                <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
                {likeCount > 0 && <span>{likeCount}</span>}
                <span>Curtir</span>
              </button>
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <MessageCircle className="w-4 h-4" />
                {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <ScrollArea className="flex-1 px-5">
                <div className="space-y-4 py-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      {renderAvatar(c.expand?.user)}
                      <div className="flex-1">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-slate-700">
                            {c.expand?.user?.name || 'Anônimo'}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">{c.content}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(c.created)}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      Nenhum comentário ainda.
                    </p>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t flex gap-2">
                <Textarea
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[44px] max-h-24 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleComment()
                    }
                  }}
                />
                <Button
                  onClick={handleComment}
                  disabled={loading || !newComment.trim()}
                  size="icon"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-400">Carregando...</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
