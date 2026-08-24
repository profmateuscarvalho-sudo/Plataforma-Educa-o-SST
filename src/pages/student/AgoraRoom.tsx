import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useTrackAccess } from '@/hooks/use-track-access'
import { useRealtime } from '@/hooks/use-realtime'
import { AgoraDebate, AgoraVoto, AgoraPosicao } from '@/types'
import {
  getDebateById,
  getVotosByDebate,
  getUserVoto,
  getUserApoiosForVotos,
  buildWhatsAppShareUrl,
} from '@/services/agora'
import { AgoraCountdown } from '@/components/agora/AgoraCountdown'
import { ScoreBoard } from '@/components/agora/ScoreBoard'
import { ArgumentCard } from '@/components/agora/ArgumentCard'
import { VoteModal } from '@/components/agora/VoteModal'
import { ModeratorPanel } from '@/components/agora/ModeratorPanel'
import { Button } from '@/components/ui/button'
import {
  Landmark,
  ArrowLeft,
  Share2,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Sparkles,
  ShieldAlert,
  Calendar,
  Lock,
  UserCheck,
  Award,
  BookOpen,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function AgoraRoom() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  useTrackAccess('Sala do Debate Ágora', [id])

  const [debate, setDebate] = useState<AgoraDebate | null>(null)
  const [votos, setVotos] = useState<AgoraVoto[]>([])
  const [userVoto, setUserVoto] = useState<AgoraVoto | null>(null)
  const [userApoios, setUserApoios] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Controle de Abas em Mobile (< 768px)
  const [mobileTab, setMobileTab] = useState<AgoraPosicao>('a_favor')

  // Modal de Votação
  const [voteModalOpen, setVoteModalOpen] = useState(false)
  const [initialPosicao, setInitialPosicao] = useState<AgoraPosicao>('a_favor')

  const loadDebateData = async () => {
    if (!id) return
    try {
      const d = await getDebateById(id)
      setDebate(d)

      const vList = await getVotosByDebate(id)
      setVotos(vList)

      if (user) {
        const myVote = await getUserVoto(id, user.id)
        setUserVoto(myVote)

        const apoios = await getUserApoiosForVotos(
          vList.map((v) => v.id),
          user.id,
        )
        setUserApoios(apoios)
      }
    } catch (err) {
      console.error('Erro ao carregar sala do debate:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDebateData()
  }, [id, user?.id])

  useRealtime('agora_debates', () => loadDebateData())
  useRealtime('agora_votos', () => loadDebateData())
  useRealtime('agora_apoios', () => loadDebateData())

  // Cálculos de votos e estatísticas
  const votosAFavor = useMemo(() => votos.filter((v) => v.posicao === 'a_favor'), [votos])
  const votosContra = useMemo(() => votos.filter((v) => v.posicao === 'contra'), [votos])
  const votosComplem = useMemo(() => votos.filter((v) => v.posicao === 'complementacao'), [votos])

  const votosCount = useMemo(
    () => ({
      a_favor: votosAFavor.length,
      contra: votosContra.length,
      complementacao: votosComplem.length,
      total: votos.length,
    }),
    [votosAFavor, votosContra, votosComplem, votos],
  )

  // Encontra o mais apoiado de cada coluna
  const mostSupportedId = useMemo(() => {
    const getTop = (list: AgoraVoto[]) => {
      if (list.length === 0) return null
      const sorted = [...list].sort((a, b) => (b.apoios || 0) - (a.apoios || 0))
      return (sorted[0]?.apoios || 0) > 0 ? sorted[0].id : null
    }

    return {
      a_favor: getTop(votosAFavor),
      contra: getTop(votosContra),
      complementacao: getTop(votosComplem),
    }
  }, [votosAFavor, votosContra, votosComplem])

  if (loading || !debate) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Landmark className="w-10 h-10 text-[#C17A4E] animate-bounce mx-auto" />
          <p className="text-slate-600 font-serif text-lg">Carregando sala de debate...</p>
        </div>
      </div>
    )
  }

  const isModerator = user && (user.id === debate.moderador_id || user.role === 'admin')
  const isExpired =
    debate.status === 'encerrado' || new Date(debate.data_termino).getTime() <= Date.now()
  const canVote = user && !userVoto && !isExpired

  const mod = debate.expand?.moderador_id
  const modName = mod?.name || 'Moderador'
  const modAvatar = mod?.avatar ? pb.files.getUrl(mod, mod.avatar) : null

  const tags = (debate.categoria_tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const waShareUrl = buildWhatsAppShareUrl(debate.tema, debate.data_termino, debate.id)

  const handleOpenVoteModal = (pos: AgoraPosicao) => {
    setInitialPosicao(pos)
    setVoteModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-slate-800 pb-20">
      {/* Barra Superior de Navegação */}
      <div className="bg-[#2C5F7C] text-white py-4 px-4 md:px-8 border-b border-[#C4A43A]/30">
        <div className="container max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/plataforma/agora"
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para a Ágora
          </Link>

          <div className="flex items-center gap-2">
            <a
              href={waShareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartilhar no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 md:px-8 pt-6 space-y-8">
        {/* Banner de Debate Encerrado */}
        {isExpired && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between flex-wrap gap-3 shadow-md border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C4A43A]/20 flex items-center justify-center text-lg">
                <Lock className="w-4 h-4 text-[#C4A43A]" />
              </div>
              <div>
                <p className="font-serif font-bold text-base text-[#FAF8F3]">Debate Encerrado</p>
                <p className="text-slate-300 text-xs">
                  O período de votação terminou. Todos os votos e argumentos tornaram-se definitivos
                  para consulta no acervo histórico.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-700 text-slate-300">
              Somente Leitura
            </span>
          </div>
        )}

        {/* 1. Destaque Central Estilo "Pergaminho da Ágora" */}
        <div className="relative bg-gradient-to-br from-[#FFFDF9] via-[#FAF6ED] to-[#F5EFE3] rounded-3xl p-6 md:p-10 border border-[#C4A43A]/30 shadow-md">
          {/* Decoração sutil de colunas clássicas */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C17A4E]/10 border border-[#C17A4E]/25 text-[#C17A4E] text-xs font-bold uppercase tracking-wider">
              <Landmark className="w-3.5 h-3.5" />
              <span>Sala de Deliberação</span>
            </div>

            {/* Contagem Regressiva estilo Ampulheta */}
            <AgoraCountdown dataTermino={debate.data_termino} status={debate.status} />
          </div>

          {/* Tema Central em Destaque */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
            {debate.tema}
          </h1>

          {/* Contexto / Descrição */}
          <div className="text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-line mb-6 max-w-4xl">
            {debate.descricao}
          </div>

          {/* Meta Info: Tags + Moderador */}
          <div className="pt-4 border-t border-[#C4A43A]/20 flex items-center justify-between flex-wrap gap-4">
            {/* Tags */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 border border-[#C4A43A]/30 text-slate-700 shadow-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Moderador */}
            <div className="flex items-center gap-2.5 bg-white/70 px-3.5 py-1.5 rounded-full border border-slate-200/80">
              {modAvatar ? (
                <img
                  src={modAvatar}
                  alt={modName}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#2C5F7C]/15 text-[#2C5F7C] font-bold text-[10px] flex items-center justify-center shrink-0">
                  {modName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-slate-600">
                Moderado por <strong className="text-slate-800">{modName}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Regras de Conduta Retrátil/Discreta */}
        {debate.regras_conduta && (
          <div className="p-4 rounded-xl bg-white/80 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Regras de Conduta da Ágora:
              </span>
              <p className="whitespace-pre-line text-slate-600 leading-relaxed font-sans">
                {debate.regras_conduta}
              </p>
            </div>
          </div>
        )}

        {/* 2. Placar em Tempo Real */}
        <ScoreBoard votosCount={votosCount} />

        {/* Se o usuário já votou, mostra o voto dele destacado */}
        {userVoto && (
          <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-[#FAF8F3] to-[#F4ECE1] border-2 border-[#C17A4E]/40 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#C17A4E] uppercase tracking-wider">
                <UserCheck className="w-4 h-4" />
                <span>Seu Voto Registrado (Definitivo)</span>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                Posição:{' '}
                {userVoto.posicao === 'a_favor'
                  ? 'A Favor'
                  : userVoto.posicao === 'contra'
                    ? 'Contra'
                    : 'Complementação'}
              </span>
            </div>
            <p className="text-sm text-slate-700 italic leading-relaxed">
              "{userVoto.justificativa}"
            </p>
          </div>
        )}

        {/* 3. Seção / Botão de Votação para quem ainda não votou */}
        {canVote && (
          <div className="bg-gradient-to-br from-[#2C5F7C] to-[#1D4459] rounded-2xl p-6 md:p-8 text-white text-center shadow-lg space-y-4">
            <h3 className="font-serif text-xl md:text-2xl font-bold text-[#FAF8F3]">
              Qual é o seu posicionamento técnico?
            </h3>
            <p className="text-slate-200 text-xs md:text-sm max-w-xl mx-auto">
              Contribua com a deliberação escolhendo sua posição e fornecendo uma justificativa
              fundamentada de no mínimo 50 caracteres.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => handleOpenVoteModal('a_favor')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Votar A Favor
              </Button>
              <Button
                onClick={() => handleOpenVoteModal('contra')}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
              >
                <XCircle className="w-4 h-4" /> Votar Contra
              </Button>
              <Button
                onClick={() => handleOpenVoteModal('complementacao')}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> Votar Complementação
              </Button>
            </div>
          </div>
        )}

        {/* 4. Colunas / Abas de Argumentos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>🏛️ Argumentos da Comunidade</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {votos.length} {votos.length === 1 ? 'argumento' : 'argumentos'} publicados
            </span>
          </div>

          {/* Abas horizontais em Mobile (< 768px) */}
          <div className="md:hidden flex items-center p-1 bg-slate-200/80 rounded-xl">
            <button
              onClick={() => setMobileTab('a_favor')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === 'a_favor' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Favor ({votosAFavor.length})
            </button>
            <button
              onClick={() => setMobileTab('contra')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === 'contra' ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Contra ({votosContra.length})
            </button>
            <button
              onClick={() => setMobileTab('complementacao')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === 'complementacao'
                  ? 'bg-white text-sky-800 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Complem. ({votosComplem.length})
            </button>
          </div>

          {/* Grid de 3 Colunas em Desktop / Abas em Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Coluna A Favor */}
            <div className={`space-y-4 ${mobileTab !== 'a_favor' ? 'hidden md:block' : 'block'}`}>
              <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-500">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>A Favor ({votosAFavor.length})</span>
                </div>
              </div>

              {votosAFavor.length === 0 ? (
                <div className="text-center py-8 px-4 bg-emerald-50/30 rounded-xl border border-dashed border-emerald-200 text-xs text-slate-500">
                  Nenhum argumento favorável ainda. Seja o primeiro a defender esta posição!
                </div>
              ) : (
                votosAFavor.map((v) => (
                  <ArgumentCard
                    key={v.id}
                    voto={v}
                    currentUserId={user?.id}
                    isMostSupported={mostSupportedId.a_favor === v.id}
                    isSupportedByMe={userApoios.has(v.id)}
                    onApoioChange={(vId, sup) => {
                      setUserApoios((prev) => {
                        const n = new Set(prev)
                        if (sup) n.add(vId)
                        else n.delete(vId)
                        return n
                      })
                    }}
                  />
                ))
              )}
            </div>

            {/* Coluna Contra */}
            <div className={`space-y-4 ${mobileTab !== 'contra' ? 'hidden md:block' : 'block'}`}>
              <div className="flex items-center justify-between pb-2 border-b-2 border-rose-500">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Contra ({votosContra.length})</span>
                </div>
              </div>

              {votosContra.length === 0 ? (
                <div className="text-center py-8 px-4 bg-rose-50/30 rounded-xl border border-dashed border-rose-200 text-xs text-slate-500">
                  Nenhum argumento contrário ainda. Apresente os contra-argumentos técnicos!
                </div>
              ) : (
                votosContra.map((v) => (
                  <ArgumentCard
                    key={v.id}
                    voto={v}
                    currentUserId={user?.id}
                    isMostSupported={mostSupportedId.contra === v.id}
                    isSupportedByMe={userApoios.has(v.id)}
                    onApoioChange={(vId, sup) => {
                      setUserApoios((prev) => {
                        const n = new Set(prev)
                        if (sup) n.add(vId)
                        else n.delete(vId)
                        return n
                      })
                    }}
                  />
                ))
              )}
            </div>

            {/* Coluna Complementação */}
            <div
              className={`space-y-4 ${
                mobileTab !== 'complementacao' ? 'hidden md:block' : 'block'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b-2 border-sky-500">
                <div className="flex items-center gap-2 font-bold text-sm text-sky-800">
                  <PlusCircle className="w-4 h-4 text-sky-600" />
                  <span>Complementação ({votosComplem.length})</span>
                </div>
              </div>

              {votosComplem.length === 0 ? (
                <div className="text-center py-8 px-4 bg-sky-50/30 rounded-xl border border-dashed border-sky-200 text-xs text-slate-500">
                  Nenhuma complementação ainda. Apresente nuances e caminhos alternativos!
                </div>
              ) : (
                votosComplem.map((v) => (
                  <ArgumentCard
                    key={v.id}
                    voto={v}
                    currentUserId={user?.id}
                    isMostSupported={mostSupportedId.complementacao === v.id}
                    isSupportedByMe={userApoios.has(v.id)}
                    onApoioChange={(vId, sup) => {
                      setUserApoios((prev) => {
                        const n = new Set(prev)
                        if (sup) n.add(vId)
                        else n.delete(vId)
                        return n
                      })
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* 5. Painel do Moderador ou Síntese Oficial (quando encerrado) */}
        {isExpired && (
          <div className="space-y-6 pt-4">
            {isModerator ? (
              <ModeratorPanel debate={debate} onUpdateSuccess={loadDebateData} />
            ) : (
              (debate.conclusoes || debate.aprendizados) && (
                <div className="bg-[#FAF8F3] border-2 border-[#C4A43A]/40 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 text-[#C4A43A] font-bold text-xs uppercase tracking-wider">
                    <Award className="w-4 h-4" />
                    <span>Síntese Oficial do Moderador ({modName})</span>
                  </div>

                  {debate.conclusoes && (
                    <div className="space-y-2">
                      <h4 className="font-serif font-bold text-lg text-slate-900">
                        Conclusões Gerais
                      </h4>
                      <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">
                        {debate.conclusoes}
                      </p>
                    </div>
                  )}

                  {debate.aprendizados && (
                    <div className="space-y-2 pt-4 border-t border-slate-200">
                      <h4 className="font-serif font-bold text-lg text-slate-900">
                        Principais Aprendizados e Recomendações
                      </h4>
                      <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">
                        {debate.aprendizados}
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Modal de Votação */}
      {user && (
        <VoteModal
          open={voteModalOpen}
          onClose={() => setVoteModalOpen(false)}
          debateId={debate.id}
          userId={user.id}
          initialPosicao={initialPosicao}
          onVoteSuccess={loadDebateData}
        />
      )}
    </div>
  )
}
