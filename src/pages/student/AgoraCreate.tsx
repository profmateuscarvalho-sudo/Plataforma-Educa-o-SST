import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useTrackAccess } from '@/hooks/use-track-access'
import {
  createDebate,
  DEFAULT_REGRAS_CONDUTA,
  SUGESTOES_TAGS,
  buildWhatsAppShareUrl,
} from '@/services/agora'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import {
  Landmark,
  ArrowLeft,
  Calendar,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldAlert,
} from 'lucide-react'

export default function AgoraCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useTrackAccess('Criar Debate Ágora')

  const [tema, setTema] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 16)
  })
  const [dataTermino, setDataTermino] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7) // Padrão: 7 dias
    return d.toISOString().slice(0, 16)
  })
  const [regrasConduta, setRegrasConduta] = useState(DEFAULT_REGRAS_CONDUTA)
  const [submitting, setSubmitting] = useState(false)

  // Estado de sucesso pós-criação
  const [createdDebateId, setCreatedDebateId] = useState<string | null>(null)
  const [createdTema, setCreatedTema] = useState<string>('')
  const [createdTermino, setCreatedTermino] = useState<string>('')

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag))
    } else {
      setTags([...tags, tag])
    }
  }

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault()
      const t = customTag.trim()
      if (!tags.includes(t)) {
        setTags([...tags, t])
      }
      setCustomTag('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: 'Acesso restrito',
        description: 'Faça login para abrir um debate.',
        variant: 'destructive',
      })
      return
    }

    if (!tema.trim() || !descricao.trim() || !dataInicio || !dataTermino) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos requeridos do debate.',
        variant: 'destructive',
      })
      return
    }

    const start = new Date(dataInicio).getTime()
    const end = new Date(dataTermino).getTime()
    if (end <= start) {
      toast({
        title: 'Data de término inválida',
        description: 'A data de término deve ser posterior à data de início.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const now = new Date().getTime()
      const status = start <= now ? 'em_andamento' : 'agendado'

      const debate = await createDebate({
        tema: tema.trim(),
        descricao: descricao.trim(),
        categoria_tags: tags.join(', '),
        data_inicio: new Date(dataInicio).toISOString(),
        data_termino: new Date(dataTermino).toISOString(),
        regras_conduta: regrasConduta.trim(),
        moderador_id: user.id,
        status,
      })

      setCreatedDebateId(debate.id)
      setCreatedTema(debate.tema)
      setCreatedTermino(debate.data_termino)

      toast({
        title: '🏛️ Debate criado na Ágora!',
        description: 'Seu debate já foi publicado no Quadro de Avisos e está pronto.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao criar debate',
        description: err?.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
      setSubmitting(false)
    }
  }

  if (createdDebateId) {
    const waUrl = buildWhatsAppShareUrl(createdTema, createdTermino, createdDebateId)

    return (
      <div className="min-h-screen bg-[#FAF8F3] py-12 px-4">
        <div className="container max-w-xl mx-auto bg-white rounded-2xl p-8 border border-[#C17A4E]/30 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#C17A4E]/15 text-[#C17A4E] mx-auto flex items-center justify-center text-3xl">
            🏛️
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl md:text-3xl font-extrabold text-slate-900">
              Debate Aberto com Sucesso!
            </h2>
            <p className="text-slate-600 text-sm">
              O tema <strong>"{createdTema}"</strong> já está disponível para participação de toda a
              comunidade.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-slate-200 text-xs text-slate-600 text-left space-y-1">
            <p className="font-bold text-slate-800">Próximos passos:</p>
            <p>1. Compartilhe o link no WhatsApp e grupos de SST.</p>
            <p>2. Acompanhe os argumentos das 3 frentes técnicas.</p>
            <p>3. Ao encerrar o prazo, publique as conclusões oficiais como moderador.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
            >
              <Share2 className="w-4 h-4" /> Compartilhar no WhatsApp
            </a>

            <Button
              onClick={() => navigate(`/plataforma/agora/${createdDebateId}`)}
              className="w-full sm:w-auto bg-[#C17A4E] hover:bg-[#A9663D] text-white font-bold px-6 py-3 rounded-xl"
            >
              Acessar Sala do Debate
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-slate-800 pb-16">
      {/* Top Header */}
      <div className="bg-[#2C5F7C] text-white py-8 px-4 md:px-8 border-b border-[#C4A43A]/30">
        <div className="container max-w-3xl mx-auto">
          <Link
            to="/plataforma/agora"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-xs font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para a Ágora
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C4A43A]/20 flex items-center justify-center text-xl">
              🏛️
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#FAF8F3]">
                Abrir Novo Debate Técnico
              </h1>
              <p className="text-slate-300 text-xs md:text-sm">
                Proponha um tema relevante de SST para deliberação da comunidade técnica.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="container max-w-3xl mx-auto px-4 md:px-8 -mt-4">
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/90">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tema */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Tema do Debate (Título Curto)</span>
                <span className="text-red-500">*</span>
              </label>
              <Input
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ex: Trava-quedas retrátil em trabalhos acima de 4m: obrigatoriedade x viabilidade"
                className="bg-slate-50 border-slate-300 focus:bg-white text-sm font-medium"
                required
              />
              <p className="text-[11px] text-slate-500">
                Seja claro, objetivo e foque no ponto central da controvérsia ou discussão técnica.
              </p>
            </div>

            {/* Descrição / Contexto */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Contexto, Cenário e Pergunta Disparadora</span>
                <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Apresente o cenário normativo (NRs pertinentes), os desafios práticos vivenciados em campo e a pergunta que os debatedores devem responder..."
                className="min-h-[140px] bg-slate-50 border-slate-300 focus:bg-white text-sm leading-relaxed"
                required
              />
            </div>

            {/* Tags e Sugestões */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#C17A4E]" />
                <span>Categorias / Tags Técnicas</span>
              </label>

              {/* Sugestões clicáveis */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGESTOES_TAGS.map((sug) => {
                  const isSelected = tags.includes(sug)
                  return (
                    <button
                      type="button"
                      key={sug}
                      onClick={() => handleToggleTag(sug)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[#C17A4E] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {sug}
                    </button>
                  )
                })}
              </div>

              {/* Input de tag customizada */}
              <div className="pt-2">
                <Input
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  placeholder="Digite outra tag e pressione Enter..."
                  className="bg-slate-50 border-slate-300 text-xs h-9"
                />
              </div>

              {tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-500">Selecionadas:</span>
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#FAF8F3] border border-[#C17A4E]/30 text-[#C17A4E] font-medium"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleToggleTag(t)}
                        className="hover:text-red-500 ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Datas de Início e Término */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Data/Hora de Início</span>
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-slate-50 border-slate-300 text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C17A4E]" />
                  <span>Data/Hora de Término</span>
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={dataTermino}
                  onChange={(e) => setDataTermino(e.target.value)}
                  className="bg-slate-50 border-slate-300 text-sm font-semibold text-[#C17A4E]"
                  required
                />
              </div>
            </div>

            {/* Regras de Conduta */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Regras de Conduta do Debate</span>
              </label>
              <Textarea
                value={regrasConduta}
                onChange={(e) => setRegrasConduta(e.target.value)}
                className="min-h-[100px] bg-slate-50 border-slate-300 text-xs text-slate-700 font-mono leading-relaxed"
              />
              <p className="text-[11px] text-slate-500">
                Texto padrão sugerido pela plataforma. Você pode personalizar as diretrizes para
                este debate específico.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/plataforma/agora')}
                disabled={submitting}
                className="border-slate-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#C17A4E] hover:bg-[#A9663D] text-white font-bold px-8 py-2.5 shadow-md"
              >
                {submitting ? 'Publicando Debate...' : 'Criar e Publicar Debate'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
