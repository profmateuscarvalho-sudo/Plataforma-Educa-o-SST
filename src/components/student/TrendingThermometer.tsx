import { useState, useEffect, useCallback } from 'react'
import { getCases, getLikesForCases } from '@/services/professional-cases'
import { ProfessionalCase } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import { CaseDetailModal } from '@/components/student/CaseDetailModal'
import pb from '@/lib/pocketbase/client'
import { Flame, Heart, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendingItem {
  caseData: ProfessionalCase
  likes: number
  comments: number
  score: number
}

export function TrendingThermometer() {
  const [items, setItems] = useState<TrendingItem[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const cases = await getCases()
      const ids = cases.map((c) => c.id)
      if (ids.length === 0) {
        setItems([])
        return
      }

      const likes = await getLikesForCases(ids)
      const likeCounts: Record<string, number> = {}
      for (const l of likes) {
        likeCounts[l.case] = (likeCounts[l.case] || 0) + 1
      }

      const filter = ids.map((id) => `case="${id}"`).join(' || ')
      const comments = await pb.collection('case_comments').getFullList({ filter })
      const commentCounts: Record<string, number> = {}
      for (const c of comments) {
        const caseId = c['case'] as string
        commentCounts[caseId] = (commentCounts[caseId] || 0) + 1
      }

      const trending: TrendingItem[] = cases
        .map((c) => ({
          caseData: c,
          likes: likeCounts[c.id] || 0,
          comments: commentCounts[c.id] || 0,
          score: (likeCounts[c.id] || 0) + (commentCounts[c.id] || 0),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

      setItems(trending)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('professional_cases', () => loadData())
  useRealtime('case_likes', () => loadData())
  useRealtime('case_comments', () => loadData())

  const maxScore = items.length > 0 ? Math.max(...items.map((i) => i.score), 1) : 1

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm sticky top-20">
        <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-orange-500 to-red-500">
          <Flame className="w-5 h-5 text-white" />
          <h3 className="text-lg font-bold text-white">Termômetro</h3>
          <span className="ml-auto text-xs text-white/80">Mais discutidos</span>
        </div>
        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              Nenhum caso em destaque ainda.
            </p>
          ) : (
            items.map((item, idx) => (
              <button
                key={item.caseData.id}
                onClick={() => setSelectedCaseId(item.caseData.id)}
                className="w-full text-left group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-full shrink-0 font-bold text-sm',
                      idx === 0
                        ? 'bg-amber-100 text-amber-700'
                        : idx === 1
                          ? 'bg-slate-200 text-slate-600'
                          : idx === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-50 text-slate-400',
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {item.caseData.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Heart className="w-3 h-3" />
                        {item.likes}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MessageCircle className="w-3 h-3" />
                        {item.comments}
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${(item.score / maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <CaseDetailModal caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />
    </>
  )
}
