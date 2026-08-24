import { useEffect, useState } from 'react'
import { Landmark, ArrowRight, Plus, CheckCircle2, Clock, Hourglass } from 'lucide-react'
import { getDebates } from '@/services/agora'
import { AgoraDebate } from '@/types'
import { BottomSheet } from '@/components/app/BottomSheet'
import { useNavigate } from 'react-router-dom'
import { AgoraCountdown } from '@/components/agora/AgoraCountdown'

export default function AgoraApp() {
  const navigate = useNavigate()
  const [debates, setDebates] = useState<AgoraDebate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDebate, setSelectedDebate] = useState<AgoraDebate | null>(null)

  const load = () => {
    setLoading(true)
    getDebates()
      .then(setDebates)
      .catch(() => setDebates([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const debatesAtivos = debates.filter((d) => d.status !== 'encerrado')
  const debatesEncerrados = debates.filter((d) => d.status === 'encerrado')

  return (
    <div className="px-5 pt-6 pb-24">
      <header className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C17A4E]/15 text-[#C17A4E] text-[11px] font-bold uppercase tracking-wider mb-2">
          <Landmark style={{ width: 13, height: 13 }} />
          <span>Ágora de Debates</span>
        </div>
        <h1 className="sst-title">Discussões Técnicas</h1>
        <p
          className="sst-caption"
          style={{ marginTop: 4, textTransform: 'none', letterSpacing: 0 }}
        >
          Debata temas de SST com a comunidade, fundamente seu voto e acompanhe deliberações.
        </p>
      </header>

      {/* Botão para abrir debate no navegador/completo */}
      <button
        onClick={() => navigate('/plataforma/agora/novo')}
        className="sst-tap w-full flex items-center justify-center gap-2 mb-4"
        style={{
          backgroundColor: '#C17A4E',
          color: '#ffffff',
          borderRadius: 'var(--sst-r-btn)',
          padding: '14px 16px',
          fontWeight: 700,
          fontSize: 14,
          boxShadow: '0 2px 8px rgba(193, 122, 78, 0.25)',
        }}
      >
        <Plus style={{ width: 17, height: 17 }} strokeWidth={2} />
        Abrir Novo Debate
      </button>

      {/* Lista de Debates */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 110,
                borderRadius: 'var(--sst-r-card)',
                backgroundColor: 'var(--sst-line-soft)',
              }}
            />
          ))}
        </div>
      ) : debates.length === 0 ? (
        <div className="sst-card" style={{ padding: 24, textAlign: 'center' }}>
          <Landmark className="w-8 h-8 text-[#C17A4E] mx-auto mb-2 opacity-60" />
          <p className="sst-body" style={{ color: 'var(--sst-text-2)' }}>
            Nenhum debate em andamento no momento.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Seção Em Andamento */}
          {debatesAtivos.map((d) => (
            <article
              key={d.id}
              onClick={() => setSelectedDebate(d)}
              className="sst-card sst-tap"
              style={{ padding: 16, cursor: 'pointer', borderLeft: '4px solid #C17A4E' }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: d.status === 'em_andamento' ? '#059669' : '#0284c7',
                    backgroundColor: d.status === 'em_andamento' ? '#ecfdf5' : '#f0f9ff',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  {d.status === 'em_andamento' ? '● Em andamento' : 'Agendado'}
                </span>

                <AgoraCountdown dataTermino={d.data_termino} status={d.status} compact />
              </div>

              <h3
                className="sst-card-title"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.3,
                  color: '#1e293b',
                }}
              >
                {d.tema}
              </h3>

              <p
                className="sst-body"
                style={{
                  marginTop: 6,
                  color: 'var(--sst-text-2)',
                  fontSize: 12,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {d.descricao}
              </p>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Mod: <strong>{d.expand?.moderador_id?.name || 'Moderador'}</strong>
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#C17A4E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  Ver Resumo <ArrowRight style={{ width: 13, height: 13 }} />
                </span>
              </div>
            </article>
          ))}

          {/* Encerrados */}
          {debatesEncerrados.length > 0 && (
            <div className="pt-4">
              <p
                className="sst-caption"
                style={{ marginBottom: 8, textTransform: 'uppercase', fontWeight: 700 }}
              >
                Debates Encerrados
              </p>
              {debatesEncerrados.map((d) => (
                <article
                  key={d.id}
                  onClick={() => setSelectedDebate(d)}
                  className="sst-card sst-tap opacity-85 mb-2"
                  style={{ padding: 14, cursor: 'pointer' }}
                >
                  <h4
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#475569',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {d.tema}
                  </h4>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                    <span>Encerrado</span>
                    <span style={{ color: '#C17A4E', fontWeight: 600 }}>Ver conclusões →</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Sheet com Resumo do Debate e Botão para Abrir Sala Completa */}
      <BottomSheet open={!!selectedDebate} onClose={() => setSelectedDebate(null)}>
        {selectedDebate && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#C17A4E]/15 text-[#C17A4E]">
                <Landmark style={{ width: 16, height: 16 }} />
              </span>
              <p className="sst-label" style={{ color: '#C17A4E', margin: 0 }}>
                Ágora de Debates
              </p>
            </div>

            <h2 className="font-serif text-lg font-bold text-slate-900 leading-snug">
              {selectedDebate.tema}
            </h2>

            <AgoraCountdown
              dataTermino={selectedDebate.data_termino}
              status={selectedDebate.status}
            />

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
              <p className="font-semibold text-slate-900 mb-1">Cenário / Contexto:</p>
              {selectedDebate.descricao}
            </div>

            {selectedDebate.categoria_tags && (
              <div className="flex flex-wrap gap-1">
                {selectedDebate.categoria_tags.split(',').map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-[11px] bg-[#FAF8F3] border border-[#C17A4E]/30 text-[#C17A4E]"
                  >
                    #{t.trim()}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                const id = selectedDebate.id
                setSelectedDebate(null)
                navigate(`/plataforma/agora/${id}`)
              }}
              className="sst-tap w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md"
              style={{ backgroundColor: '#C17A4E' }}
            >
              <span>Entrar na Sala e Votar</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
