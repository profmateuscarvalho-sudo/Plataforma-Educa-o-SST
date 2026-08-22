import { useEffect, useState } from 'react'
import {
  Flame,
  BookOpen,
  ClipboardList,
  NotebookPen,
  Download,
  Bell,
  BadgeCheck,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getPerfilStats, getLembrete, setLembrete, type PerfilStats } from '@/services/appService'
import { toast } from '@/hooks/use-toast'

export default function Profile() {
  const { user } = useAuth()
  const [stats, setStats] = useState<PerfilStats | null>(null)
  const [lembrete, setLembreteState] = useState<{ ativo: boolean; hora: string }>({
    ativo: true,
    hora: '19:00',
  })
  const [saving, setSaving] = useState(false)
  const [planLabel, setPlanLabel] = useState('—')

  useEffect(() => {
    if (!user) return
    getPerfilStats(user.id)
      .then(setStats)
      .catch(() => setStats(null))
    getLembrete(user.id)
      .then(setLembreteState)
      .catch(() => {})
    const tier = user.plan_tier || 'free'
    setPlanLabel(tier === 'ouro' ? 'Ouro' : tier === 'prata' ? 'Prata' : 'Gratuito')
  }, [user])

  const toggleLembrete = async (ativo: boolean) => {
    if (!user) return
    setLembreteState((s) => ({ ...s, ativo }))
    setSaving(true)
    await setLembrete(user.id, ativo)
    setSaving(false)
    if (ativo) {
      try {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') {
          toast({
            title: 'Permita as notificações',
            description: 'Ative nas configurações do navegador para receber o lembrete.',
          })
        }
      } catch {
        /* noop */
      }
    }
  }

  const changeHora = async (hora: string) => {
    if (!user) return
    setLembreteState((s) => ({ ...s, hora }))
    setSaving(true)
    await setLembrete(user.id, lembrete.ativo, hora)
    setSaving(false)
  }

  const recorde = stats?.recorde ?? 0
  const atual = stats?.sequenciaAtual ?? 0
  const faltam = recorde > atual ? recorde - atual : 0
  const comparison =
    recorde === 0
      ? 'Comece sua sequência respondendo a dose de hoje.'
      : atual >= recorde
        ? `Você está no seu recorde: ${recorde} dias.`
        : `Seu recorde é ${recorde} dias. Faltam ${faltam} para empatar.`

  const numberCards = [
    { label: 'Revistas lidas', value: stats?.revistasLidas ?? '—', icon: BookOpen },
    {
      label: 'Simulados concluídos',
      value: stats?.simuladosConcluidos ?? '—',
      icon: ClipboardList,
    },
    { label: 'Anotações', value: stats?.anotacoesCaderno ?? '—', icon: NotebookPen },
  ]

  return (
    <div className="px-5 pt-6">
      <header className="mb-6">
        <h1 className="sst-title">Seu perfil</h1>
      </header>

      {/* Streak card */}
      <section
        className="sst-card-lg relative overflow-hidden"
        style={{ backgroundColor: 'var(--sst-amber)', padding: 20, marginBottom: 16 }}
      >
        <p
          style={{
            color: 'var(--sst-amber-ink)',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Sequência de dose
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Flame style={{ width: 28, height: 28, color: 'var(--sst-text)' }} strokeWidth={1.75} />
          <span
            className="sst-display"
            style={{ fontSize: 40, lineHeight: 1, color: 'var(--sst-text)' }}
          >
            {atual}
          </span>
          <span style={{ fontSize: 13, color: 'var(--sst-amber-ink)', fontWeight: 600 }}>
            dias seguidos
          </span>
        </div>
        <p style={{ marginTop: 10, fontSize: 12.5, color: 'var(--sst-text)', opacity: 0.78 }}>
          {comparison}
        </p>
      </section>

      {/* Number cards */}
      <section className="grid grid-cols-3 gap-3 mb-6">
        {numberCards.map((c) => (
          <div key={c.label} className="sst-card" style={{ padding: 14, textAlign: 'center' }}>
            <div className="flex items-center justify-center" style={{ marginBottom: 8 }}>
              <c.icon
                style={{ width: 20, height: 20, color: 'var(--sst-text-2)' }}
                strokeWidth={1.75}
              />
            </div>
            <p className="sst-display" style={{ fontSize: 22, lineHeight: 1 }}>
              {c.value}
            </p>
            <p className="sst-caption" style={{ marginTop: 4, fontSize: 10 }}>
              {c.label}
            </p>
          </div>
        ))}
      </section>

      {/* Settings list */}
      <section className="flex flex-col gap-2">
        <Row
          icon={Download}
          title="Downloads offline"
          desc="Conteúdos salvos para ler sem internet"
        >
          <span className="sst-caption" style={{ fontSize: 11 }}>
            Em breve
          </span>
        </Row>

        <div className="sst-card" style={{ padding: 14 }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: 'var(--sst-amber-wash)',
              }}
            >
              <Bell
                style={{ width: 20, height: 20, color: 'var(--sst-amber)' }}
                strokeWidth={1.75}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="sst-card-title">Lembrete diário</p>
              <p className="sst-caption" style={{ marginTop: 2 }}>
                Receba um aviso quando a dose estiver disponível.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 gap-3">
            <label
              className="sst-caption"
              style={{
                textTransform: 'none',
                letterSpacing: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <input
                type="checkbox"
                checked={lembrete.ativo}
                onChange={(e) => toggleLembrete(e.target.checked)}
                disabled={saving}
                style={{ width: 18, height: 18, accentColor: 'var(--sst-amber)' }}
              />
              Ativar
            </label>
            <input
              type="time"
              value={lembrete.hora}
              onChange={(e) => changeHora(e.target.value)}
              disabled={saving || !lembrete.ativo}
              style={{
                border: '1px solid var(--sst-line)',
                borderRadius: 'var(--sst-r-btn)',
                padding: '6px 10px',
                fontSize: 13,
                color: 'var(--sst-text)',
                opacity: lembrete.ativo ? 1 : 0.5,
              }}
            />
          </div>
        </div>

        <Row icon={BadgeCheck} title="Status do plano" desc="Sua assinatura atual" to="/planos">
          <span
            className="sst-pill"
            style={{
              backgroundColor: 'var(--sst-amber-wash)',
              color: 'var(--sst-amber-ink)',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
            }}
          >
            {planLabel}
          </span>
        </Row>
      </section>
    </div>
  )
}

function Row({
  icon: Icon,
  title,
  desc,
  children,
  to,
}: {
  icon: typeof Download
  title: string
  desc: string
  children?: React.ReactNode
  to?: string
}) {
  const content = (
    <div className="sst-card flex items-center gap-3" style={{ padding: 14 }}>
      <div
        className="flex items-center justify-center"
        style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'var(--sst-line-soft)' }}
      >
        <Icon style={{ width: 20, height: 20, color: 'var(--sst-text-2)' }} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="sst-card-title">{title}</p>
        <p className="sst-caption" style={{ marginTop: 2 }}>
          {desc}
        </p>
      </div>
      {children}
    </div>
  )
  if (to) {
    return (
      <a href={to} className="sst-tap block">
        {content}
      </a>
    )
  }
  return content
}
