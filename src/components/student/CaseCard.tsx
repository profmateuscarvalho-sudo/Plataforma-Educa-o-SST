import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { ProfessionalCase } from '@/types'

interface CaseCardProps {
  caseData: ProfessionalCase
  onClick: () => void
}

export function CaseCard({ caseData: c, onClick }: CaseCardProps) {
  const author = c.expand?.user
  const authorName = author?.name || 'Usuário'
  const avatarUrl = author?.avatar ? pb.files.getUrl(author, author.avatar) : null

  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-teal-300 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-10 h-10 shrink-0">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={authorName} /> : null}
          <AvatarFallback className="bg-teal-100 text-teal-700 font-medium">
            {authorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
            {c.title}
          </h3>
          <p className="text-xs text-slate-400">
            {authorName} ·{' '}
            {new Date(c.created).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            })}
          </p>
        </div>
      </div>
      <p className="text-sm text-slate-500 line-clamp-3 whitespace-pre-wrap">{c.content}</p>
      <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Ver discussão</span>
      </div>
    </button>
  )
}
