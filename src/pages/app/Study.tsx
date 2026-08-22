import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, ArrowRight, Play, RotateCcw } from 'lucide-react'
import { getProgressoSimulados, type SimuladoProgresso } from '@/services/appService'
import { useAuth } from '@/hooks/use-auth'
import { BottomSheet } from '@/components/app/BottomSheet'

type SimuladoProgressoItem = SimuladoProgresso['items'][number]

export default function Study() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [progresso, setProgresso] = useState<SimuladoProgresso | null>(null)
  const [openItem, setOpenItem] = useState<SimuladoProgressoItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getProgressoSimulados(user.id)
      .then(setProgresso)
      .finally(() => setLoading(false))
  }, [user])

  const stats = useMemo(() => {
    if (!progresso) return []
    return [
      { label: 'Disponíveis', value: progresso.disponiveis },
      { label: 'Concluídos', value: progresso.concluidos },
      { label: 'Média', value: progresso.media === null ? '—' : `${progresso.media}%` },
    ]
  }, [progresso])

  return (
    <div className="px-5 pt-6">
      <header className="mb-6">
        <h1 className="sst-title">Simulados</h1>
        <p
          className="sst-caption"
          style={{ marginTop: 4, textTransform: 'none', letterSpacing: 0 }}
        >
          Teste seus conhecimentos e acompanhe seu progresso.
        </p>
      </header>

      {/* Number cards */}
      <section className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="sst-card" style={{ padding: 14, textAlign: 'center' }}>
            <p className="sst-display" style={{ fontSize: 26, lineHeight: 1 }}>
              {loading ? '—' : s.value}
            </p>
            <p className="sst-caption" style={{ marginTop: 6 }}>
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* List */}
      <section>
        <p className="sst-label" style={{ marginBottom: 10 }}>
          Todos os simulados
        </p>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 64,
                  borderRadius: 'var(--sst-r-card)',
                  backgroundColor: 'var(--sst-line-soft)',
                }}
              />
            ))}
          </div>
        ) : !progresso || progresso.items.length === 0 ? (
          <div className="sst-card" style={{ padding: 24, textAlign: 'center' }}>
            <p className="sst-body" style={{ color: 'var(--sst-text-2)' }}>
              Nenhum simulado disponível ainda.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {progresso.items.map((item) => (
              <button
                key={item.simulado.id}
                onClick={() => setOpenItem(item)}
                className="sst-tap sst-card flex items-center gap-3 text-left"
                style={{ padding: 12 }}
              >
                <Seal status={item.status} pct={item.melhor?.percentage ?? null} />
                <div className="min-w-0 flex-1">
                  <p
                    className="sst-card-title"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.simulado.title}
                  </p>
                  <p className="sst-caption" style={{ marginTop: 2 }}>
                    {item.status === 'concluido'
                      ? `Concluído · ${item.tentativas}x · ${item.melhor?.percentage ?? 0}%`
                      : item.status === 'em_progresso'
                        ? 'Em progresso'
                        : 'Não iniciado'}
                  </p>
                </div>
                <ArrowRight
                  style={{ width: 18, height: 18, color: 'var(--sst-text-2)' }}
                  strokeWidth={1.75}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      <BottomSheet open={!!openItem} onClose={() => setOpenItem(null)}>
        {openItem && (
          <SimuladoDetail
            item={openItem}
            onContinue={() => navigate(`/plataforma/simulados/${openItem.simulado.id}`)}
          />
        )}
      </BottomSheet>
    </div>
  )
}

function Seal({ status, pct }: { status: SimuladoProgressoItem['status']; pct: number | null }) {
  const size = {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as const
  if (status === 'concluido') {
    return (
      <div style={{ ...size, backgroundColor: 'var(--sst-green-wash)' }}>
        <span
          style={{
            fontFamily: 'var(--sst-font-display)',
            fontWeight: 800,
            fontSize: 13,
            color: 'var(--sst-green)',
          }}
        >
          {pct ?? 0}%
        </span>
      </div>
    )
  }
  if (status === 'em_progresso') {
    return (
      <div style={{ ...size, backgroundColor: 'var(--sst-amber)' }}>
        <span
          style={{
            fontFamily: 'var(--sst-font-display)',
            fontWeight: 800,
            fontSize: 13,
            color: 'var(--sst-text)',
          }}
        >
          {pct ?? 0}%
        </span>
      </div>
    )
  }
  return (
    <div style={{ ...size, backgroundColor: 'var(--sst-line-soft)' }}>
      <Minus style={{ width: 18, height: 18, color: 'var(--sst-text-2)' }} strokeWidth={2} />
    </div>
  )
}

function SimuladoDetail({
  item,
  onContinue,
}: {
  item: SimuladoProgressoItem
  onContinue: () => void
}) {
  const total = item.totalQuestoes
  const respondidas = item.melhor?.score ?? 0
  return (
    <div>
      <p className="sst-label" style={{ color: 'var(--sst-amber-ink)' }}>
        {item.simulado.title}
      </p>
      <h2 className="sst-display" style={{ fontSize: 22, marginTop: 6, marginBottom: 10 }}>
        {item.simulado.title}
      </h2>
      <p className="sst-body" style={{ color: 'var(--sst-text-2)', marginBottom: 16 }}>
        {item.simulado.description || 'Sem descrição.'}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Questões" value={total || '—'} />
        <Stat label="Tentativas" value={item.tentativas} />
        <Stat label="Melhor" value={item.melhor ? `${item.melhor.percentage ?? 0}%` : '—'} />
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={onContinue}
          className="sst-tap flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'var(--sst-amber)',
            color: 'var(--sst-text)',
            borderRadius: 'var(--sst-r-btn)',
            padding: '13px 16px',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          <Play style={{ width: 16, height: 16 }} strokeWidth={2} />
          {item.status === 'concluido'
            ? 'Refazer simulado'
            : item.status === 'em_progresso'
              ? `Continuar da questão ${respondidas + 1}`
              : 'Começar simulado'}
        </button>
        {item.status !== 'nao_iniciado' && (
          <button
            onClick={onContinue}
            className="sst-tap flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--sst-text-2)',
              border: '1px solid var(--sst-line)',
              borderRadius: 'var(--sst-r-btn)',
              padding: '12px 16px',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <RotateCcw style={{ width: 15, height: 15 }} strokeWidth={1.75} />
            Recomeçar do início
          </button>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="sst-card" style={{ padding: 12, textAlign: 'center' }}>
      <p className="sst-display" style={{ fontSize: 18, lineHeight: 1 }}>
        {value}
      </p>
      <p className="sst-caption" style={{ marginTop: 4, fontSize: 10.5 }}>
        {label}
      </p>
    </div>
  )
}
