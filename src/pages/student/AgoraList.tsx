import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useTrackAccess } from '@/hooks/use-track-access'
import { useRealtime } from '@/hooks/use-realtime'
import { AgoraDebate, AgoraDebateStatus } from '@/types'
import { getDebates } from '@/services/agora'
import { AgoraCountdown } from '@/components/agora/AgoraCountdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Landmark,
  PlusCircle,
  Search,
  Users,
  Filter,
  ArrowRight,
  BookOpen,
  Calendar,
  Sparkles,
  Tag,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function AgoraList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useTrackAccess('Ágora de Debates')

  const [debates, setDebates] = useState<AgoraDebate[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<'todos' | AgoraDebateStatus>('todos')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const loadDebates = async () => {
    try {
      const list = await getDebates()
      setDebates(list)
    } catch (err) {
      console.error('Erro ao carregar debates:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDebates()
  }, [])

  useRealtime('agora_debates', () => loadDebates())

  // Extrai todas as tags únicas
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    debates.forEach((d) => {
      if (d.categoria_tags) {
        d.categoria_tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((tag) => tagsSet.add(tag))
      }
    })
    return Array.from(tagsSet)
  }, [debates])

  // Filtra os debates
  const filteredDebates = useMemo(() => {
    return debates.filter((d) => {
      // Status
      if (statusFilter !== 'todos' && d.status !== statusFilter) {
        return false
      }
      // Tag
      if (selectedTag) {
        const itemTags = (d.categoria_tags || '').split(',').map((t) => t.trim().toLowerCase())
        if (!itemTags.includes(selectedTag.toLowerCase())) {
          return false
        }
      }
      // Busca
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTema = d.tema.toLowerCase().includes(q)
        const matchDesc = d.descricao.toLowerCase().includes(q)
        const matchTags = (d.categoria_tags || '').toLowerCase().includes(q)
        if (!matchTema && !matchDesc && !matchTags) return false
      }
      return true
    })
  }, [debates, statusFilter, selectedTag, searchQuery])

  // Separa ativos/agendados e biblioteca de encerrados
  const debatesAtivos = filteredDebates.filter((d) => d.status !== 'encerrado')
  const debatesEncerrados = filteredDebates.filter((d) => d.status === 'encerrado')

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header Estilo Templo / Ágora Grega */}
      <div className="border-b border-border bg-card py-8 px-4 md:px-8">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-border text-foreground text-xs font-semibold uppercase tracking-wider">
                <Landmark className="w-3.5 h-3.5 text-primary" />
                <span>Espaço de Discussão Técnica</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground tracking-tight">
                Ágora de Debates
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
                Participe de discussões aprofundadas sobre Segurança e Saúde no Trabalho.
                Posicione-se tecnicamente, vote com argumentos e colabore para as diretrizes
                práticas do setor.
              </p>
            </div>

            <Button
              onClick={() => navigate('/plataforma/agora/novo')}
              className="min-h-[52px] rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 shrink-0 flex items-center gap-2 self-start md:self-auto"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Abrir Novo Debate</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 md:px-8 -mt-6">
        {/* Barra de Filtros e Busca */}
        <div className="bg-card text-card-foreground rounded-[28px] p-5 border border-border mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Abas de Status */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-full w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  statusFilter === 'todos'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos ({debates.length})
              </button>
              <button
                onClick={() => setStatusFilter('em_andamento')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  statusFilter === 'em_andamento'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Em andamento ({debates.filter((d) => d.status === 'em_andamento').length})
              </button>
              <button
                onClick={() => setStatusFilter('agendado')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  statusFilter === 'agendado'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Agendados ({debates.filter((d) => d.status === 'agendado').length})
              </button>
              <button
                onClick={() => setStatusFilter('encerrado')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  statusFilter === 'encerrado'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Encerrados ({debates.filter((d) => d.status === 'encerrado').length})
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por tema, tag ou palavra..."
                className="pl-10 rounded-full border-border bg-card text-foreground placeholder:text-muted-foreground text-sm min-h-[44px]"
              />
            </div>
          </div>

          {/* Tags Chips */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
                <Tag className="w-3.5 h-3.5" /> Tags:
              </span>
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  selectedTag === ''
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Todas
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    selectedTag === tag
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <Landmark className="w-8 h-8 text-[#C17A4E] animate-bounce mx-auto mb-3" />
            <p>Carregando salas da Ágora...</p>
          </div>
        ) : filteredDebates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-slate-800 mb-1">
              Nenhum debate encontrado
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-5">
              Não encontramos salas correspondentes aos filtros selecionados. Que tal iniciar um
              novo debate técnico agora?
            </p>
            <Button
              onClick={() => navigate('/plataforma/agora/novo')}
              className="bg-[#C17A4E] hover:bg-[#A9663D] text-white font-bold"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Abrir Novo Debate
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Seção 1: Debates Ativos e Agendados */}
            {(statusFilter === 'todos' ||
              statusFilter === 'em_andamento' ||
              statusFilter === 'agendado') &&
              debatesAtivos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-xl font-serif font-semibold text-foreground">
                      Debates em Andamento & Agendados
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {debatesAtivos.map((debate) => (
                      <DebateCard key={debate.id} debate={debate} />
                    ))}
                  </div>
                </div>
              )}

            {/* Seção 2: Biblioteca de Debates (Encerrados) */}
            {(statusFilter === 'todos' || statusFilter === 'encerrado') &&
              debatesEncerrados.length > 0 && (
                <div className="pt-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Archive className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-serif font-semibold text-foreground">
                      Biblioteca de Debates Concluídos
                    </h2>
                  </div>
                  <p className="text-muted-foreground text-sm mb-6">
                    Consulte o acervo histórico de deliberações, votos fundamentados e conclusões
                    técnicas oficiais.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {debatesEncerrados.map((debate) => (
                      <DebateCard key={debate.id} debate={debate} isArchived />
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  )
}

function DebateCard({ debate, isArchived = false }: { debate: AgoraDebate; isArchived?: boolean }) {
  const navigate = useNavigate()
  const mod = debate.expand?.moderador_id
  const modName = mod?.name || 'Moderador'
  const modAvatar = mod?.avatar ? pb.files.getUrl(mod, mod.avatar) : null

  const tags = (debate.categoria_tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  return (
    <div
      onClick={() => navigate(`/plataforma/agora/${debate.id}`)}
      className="bg-card text-card-foreground rounded-2xl p-6 border border-border hover:border-foreground/30 transition-all flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Header do Card */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {debate.status === 'em_andamento' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E3F1E9] text-[#1F6B4A] dark:bg-[#1F6B4A]/30 dark:text-[#E3F1E9] border border-[#1F6B4A]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B4A] animate-pulse" />
                Em andamento
              </span>
            )}
            {debate.status === 'agendado' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                <Clock className="w-3 h-3 text-primary" />
                Agendado
              </span>
            )}
            {debate.status === 'encerrado' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                <CheckCircle2 className="w-3 h-3" />
                Encerrado
              </span>
            )}
          </div>

          <AgoraCountdown dataTermino={debate.data_termino} status={debate.status} compact />
        </div>

        {/* Título / Tema */}
        <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2.5">
          {debate.tema}
        </h3>

        {/* Descrição resumida */}
        <p className="text-muted-foreground text-xs md:text-sm line-clamp-3 leading-relaxed mb-4">
          {debate.descricao}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted border border-border text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="px-1.5 py-0.5 text-[11px] text-muted-foreground">
                +{tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rodapé do Card */}
      <div className="pt-4 border-t border-border flex items-center justify-between gap-3 mt-auto">
        <div className="flex items-center gap-2 min-w-0">
          {modAvatar ? (
            <img
              src={modAvatar}
              alt={modName}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 text-foreground font-bold text-[10px] flex items-center justify-center shrink-0">
              {modName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-muted-foreground truncate">
            Mod: <strong className="text-foreground font-semibold">{modName}</strong>
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground group-hover:gap-1.5 transition-all shrink-0">
          Entrar na Sala <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  )
}
