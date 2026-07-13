import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getCases, getLikesForCases, toggleLike } from '@/services/professional-cases'
import { ProfessionalCase } from '@/types'
import { CaseDetailModal } from '@/components/student/CaseDetailModal'
import { Heart, MessageCircle, Briefcase } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml, cn } from '@/lib/utils'

export function CaseFeedSidebar() {
  const { user } = useAuth()
  const [cases, setCases] = useState<ProfessionalCase[]>([])
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [likedCases, setLikedCases] = useState<Set<string>>(new Set())
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

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

  const renderAvatar = (u: any) =>
    u?.avatar ? (
      <img
        src={pb.files.getUrl(u, u.avatar)}
        alt={u.name}
        className="w-7 h-7 rounded-full object-cover shrink-0"
      />
    ) : (
      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
        {u?.name?.charAt(0).toUpperCase() || '?'}
      </div>
    )

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col max-h-[70vh] shadow-sm">
        <div className="flex items-center gap-2 p-3 border-b border-slate-200">
          <Briefcase className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-black">Casos Profissionais</h3>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 p-2">
          {cases.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Nenhum caso compartilhado.</p>
          ) : (
            cases.map((c) => {
              const isLiked = likedCases.has(c.id)
              const likeCount = likeCounts[c.id] || 0
              return (
                <div
                  key={c.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {renderAvatar(c.expand?.user)}
                    <span className="text-xs font-medium text-slate-700 truncate">
                      {c.expand?.user?.name || 'Anônimo'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-black line-clamp-2 mb-1">{c.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {stripHtml(c.content) || c.content}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLike(c.id)}
                      className={cn(
                        'flex items-center gap-1 text-xs transition-colors',
                        isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400',
                      )}
                    >
                      <Heart className={cn('w-3.5 h-3.5', isLiked && 'fill-current')} />
                      {likeCount > 0 && likeCount}
                    </button>
                    <button
                      onClick={() => setSelectedCaseId(c.id)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Comentar
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <CaseDetailModal caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />
    </>
  )
}
