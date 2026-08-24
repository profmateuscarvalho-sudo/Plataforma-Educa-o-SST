import { AgoraVoto } from '@/types'
import { ThumbsUp, CheckCircle2, XCircle, PlusCircle, Award } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useState } from 'react'
import { toggleApoio } from '@/services/agora'
import { toast } from '@/hooks/use-toast'

interface ArgumentCardProps {
  voto: AgoraVoto
  currentUserId?: string
  isMostSupported?: boolean
  isSupportedByMe?: boolean
  onApoioChange?: (votoId: string, supported: boolean) => void
}

const POSICAO_CONFIG = {
  a_favor: {
    label: 'A Favor',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: CheckCircle2,
    borderClass: 'border-l-4 border-l-emerald-500',
    bgClass: 'bg-[#FCFDFB]',
  },
  contra: {
    label: 'Contra',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: XCircle,
    borderClass: 'border-l-4 border-l-rose-500',
    bgClass: 'bg-[#FDFBFA]',
  },
  complementacao: {
    label: 'Complementação',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    icon: PlusCircle,
    borderClass: 'border-l-4 border-l-sky-500',
    bgClass: 'bg-[#FAFBFD]',
  },
}

export function ArgumentCard({
  voto,
  currentUserId,
  isMostSupported = false,
  isSupportedByMe = false,
  onApoioChange,
}: ArgumentCardProps) {
  const [apoiosCount, setApoiosCount] = useState<number>(voto.apoios || 0)
  const [supported, setSupported] = useState<boolean>(isSupportedByMe)
  const [loading, setLoading] = useState<boolean>(false)

  const config = POSICAO_CONFIG[voto.posicao] || POSICAO_CONFIG.a_favor
  const user = voto.expand?.usuario_id
  const userName = user?.name || 'Participante'
  const userProfile = user?.professional_profile || 'Profissional SST'
  const userAvatar = user?.avatar ? pb.files.getUrl(user, user.avatar) : null

  const formattedDate = (() => {
    try {
      const d = new Date(voto.created)
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (_) {
      return ''
    }
  })()

  const handleToggleApoio = async () => {
    if (!currentUserId) {
      toast({
        title: 'Ação restrita',
        description: 'Faça login para apoiar argumentos no debate.',
        variant: 'destructive',
      })
      return
    }

    if (currentUserId === voto.usuario_id) {
      toast({
        title: 'Apoio próprio',
        description: 'Você não pode apoiar o seu próprio argumento.',
      })
      return
    }

    setLoading(true)
    const prevSupported = supported
    const prevCount = apoiosCount

    // Otimista
    setSupported(!prevSupported)
    setApoiosCount(prevSupported ? Math.max(0, prevCount - 1) : prevCount + 1)

    try {
      const result = await toggleApoio(voto.id, currentUserId)
      setSupported(result)
      onApoioChange?.(voto.id, result)
    } catch (err: any) {
      setSupported(prevSupported)
      setApoiosCount(prevCount)
      toast({
        title: 'Erro ao registrar apoio',
        description: err?.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`relative rounded-xl p-4.5 md:p-5 transition-all shadow-sm hover:shadow-md border ${
        isMostSupported
          ? 'border-[#C4A43A] ring-1 ring-[#C4A43A]/40 bg-[#FFFDF7]'
          : 'border-slate-200/80 bg-white'
      } ${config.borderClass}`}
    >
      {/* Badge de Mais Apoiado */}
      {isMostSupported && apoiosCount > 0 && (
        <div className="absolute -top-3 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C4A43A] text-white shadow-sm">
          <Award className="w-3 h-3" />
          <span>Mais apoiado</span>
        </div>
      )}

      {/* Header do Autor */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#2C5F7C]/15 text-[#2C5F7C] flex items-center justify-center font-bold text-xs shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">{userName}</h4>
            <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
              {userProfile}
            </p>
          </div>
        </div>

        <span className="text-[10px] text-slate-400 shrink-0">{formattedDate}</span>
      </div>

      {/* Texto do Argumento */}
      <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line mb-4 break-words">
        {voto.justificativa}
      </div>

      {/* Footer / Botão de Apoio */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${config.badgeClass}`}
        >
          <config.icon className="w-3 h-3" />
          {config.label}
        </span>

        <button
          onClick={handleToggleApoio}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            supported
              ? 'bg-[#C17A4E] text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title={
            currentUserId === voto.usuario_id
              ? 'Você não pode apoiar o seu próprio argumento'
              : 'Concordo com este ponto'
          }
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${supported ? 'fill-current' : ''}`} />
          <span>Concordo</span>
          <span
            className={`ml-1 font-bold px-1.5 py-0.2 rounded-full text-[10px] ${
              supported ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-800'
            }`}
          >
            {apoiosCount}
          </span>
        </button>
      </div>
    </div>
  )
}
