import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Trash2, MessageCircle, Heart } from 'lucide-react'
import { getAllCases, updateCaseStatus, deleteCase } from '@/services/professional-cases'
import { getLikesForCases, getComments } from '@/services/professional-cases'
import { ProfessionalCase, CaseLike, CaseComment } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { stripHtml } from '@/lib/utils'

export default function AdminCases() {
  const { toast } = useToast()
  const [cases, setCases] = useState<ProfessionalCase[]>([])
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  const loadData = useCallback(async () => {
    try {
      const list = await getAllCases()
      setCases(list)
      const ids = list.map((c) => c.id)
      if (ids.length > 0) {
        const likes = await getLikesForCases(ids)
        const counts: Record<string, number> = {}
        for (const l of likes) counts[l.case] = (counts[l.case] || 0) + 1
        setLikeCounts(counts)

        const cCounts: Record<string, number> = {}
        await Promise.all(
          ids.map(async (id) => {
            try {
              const comments = await getComments(id)
              cCounts[id] = comments.length
            } catch {
              cCounts[id] = 0
            }
          }),
        )
        setCommentCounts(cCounts)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('professional_cases', () => loadData())

  const handleApprove = async (id: string) => {
    try {
      await updateCaseStatus(id, 'approved')
      toast({ title: 'Case aprovado com sucesso!' })
      await loadData()
    } catch {
      toast({ title: 'Erro ao aprovar case', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCase(id)
      toast({ title: 'Case excluído com sucesso!' })
      await loadData()
    } catch {
      toast({ title: 'Erro ao excluir case', variant: 'destructive' })
    }
  }

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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Casos Profissionais</h2>
          <p className="text-slate-500 text-sm mt-1">
            Modere os cases compartilhados pela comunidade
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {cases.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-start p-4 hover:bg-slate-50 gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-800 truncate">{c.title}</p>
                  <Badge
                    variant={c.status === 'approved' ? 'default' : 'outline'}
                    className={
                      c.status === 'approved'
                        ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white shrink-0'
                        : 'border-amber-400 text-amber-600 shrink-0'
                    }
                  >
                    {c.status === 'approved' ? 'Aprovado' : 'Pendente'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                  {stripHtml(c.content) || c.content}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {renderAvatar(c.expand?.user)}
                    <div>
                      <p className="text-xs font-medium text-slate-600">
                        {c.expand?.user?.name || 'Anônimo'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(c.created).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {likeCounts[c.id] || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {commentCounts[c.id] || 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {c.status !== 'approved' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-emerald-600 hover:bg-emerald-50"
                    onClick={() => handleApprove(c.id)}
                    title="Aprovar"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(c.id)}
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {cases.length === 0 && (
            <div className="p-4 text-center text-slate-500">Nenhum case cadastrado.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
