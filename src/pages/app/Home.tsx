import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flame,
  Check,
  BookOpen,
  ClipboardList,
  Users,
  Video,
  Radio,
  NotebookPen,
  Landmark,
  UserCircle,
  ArrowRight,
  Hourglass,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import {
  getDoseDoDia,
  getDoseQuestion,
  responderDose,
  getSequencia,
  getFitaSemana,
  getContinueDeOndeParou,
  getRevistaDoMes,
  type ContinuarItem,
} from '@/services/appService'
import type { Magazine, SimuladoQuestion, Simulado } from '@/types'
import { getSimulados } from '@/services/simulados'
import { getDocProjects } from '@/services/doc_projects'
import { getCourses } from '@/services/courses'
import { getMagazines } from '@/services/magazines'
import { getMentorships } from '@/services/mentorships'
import { getStudentNotes } from '@/services/student-notes'
import { getDebates } from '@/services/agora'

// Lucide doesn't export a "magazine" icon — alias the closest available.
const MagazineIcon = NotebookPen

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

interface PlatformModule {
  key: string
  label: string
  desc: string
  icon: typeof BookOpen
  color: string
  wash: string
  to: string
}

const MODULES: PlatformModule[] = [
  {
    key: 'cursos',
    label: 'Cursos',
    desc: 'Aulas em vídeo',
    icon: BookOpen,
    color: 'var(--sst-amber)',
    wash: 'var(--sst-amber-wash)',
    to: '/plataforma',
  },
  {
    key: 'simulados',
    label: 'Simulados',
    desc: 'Teste seu nível',
    icon: ClipboardList,
    color: 'var(--sst-amber)',
    wash: 'var(--sst-amber-wash)',
    to: '/plataforma/simulados',
  },
  {
    key: 'revistas',
    label: 'Revistas',
    desc: 'Edição do mês',
    icon: MagazineIcon,
    color: 'var(--sst-purple)',
    wash: 'var(--sst-purple-wash)',
    to: '/revistas',
  },
  {
    key: 'mentorias',
    label: 'Mentorias',
    desc: 'Com especialistas',
    icon: Users,
    color: 'var(--sst-blue)',
    wash: 'var(--sst-blue-wash)',
    to: '/mentorias',
  },
  {
    key: 'documentarios',
    label: 'Documentários',
    desc: 'Séries SST',
    icon: Video,
    color: 'var(--sst-blue)',
    wash: 'var(--sst-blue-wash)',
    to: '/plataforma/documentarios',
  },
  {
    key: 'lives',
    label: 'Aulas ao vivo',
    desc: 'Transmissões',
    icon: Radio,
    color: 'var(--sst-red)',
    wash: '#fdeaea',
    to: '/plataforma/live-sessions',
  },
  {
    key: 'caderno',
    label: 'Caderno',
    desc: 'Suas anotações',
    icon: NotebookPen,
    color: 'var(--sst-green)',
    wash: 'var(--sst-green-wash)',
    to: '/plataforma/caderno',
  },
  {
    key: 'agora',
    label: 'Ágora de debates',
    desc: 'Discussões e votos',
    icon: Landmark,
    color: '#C17A4E',
    wash: 'rgba(193, 122, 78, 0.12)',
    to: '/app/agora',
  },
  {
    key: 'perfil',
    label: 'Meu perfil',
    desc: 'Conta e plano',
    icon: UserCircle,
    color: 'var(--sst-text-2)',
    wash: 'var(--sst-line-soft)',
    to: '/plataforma/perfil',
  },
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [dateLabel, setDateLabel] = useState('')
  const [greeting, setGreeting] = useState('')
  const [streak, setStreak] = useState(0)
  const [prevStreak, setPrevStreak] = useState(0)
  const [bounceKey, setBounceKey] = useState(0)

  // Dose do dia
  const [dose, setDose] = useState<{
    answered: boolean
    question_id: string
    pergunta_id?: string
    acertou?: boolean
  } | null>(null)
  const [question, setQuestion] = useState<SimuladoQuestion | null>(null)
  const [simuladoName, setSimuladoName] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [locked, setLocked] = useState(false)
  // True após a tentativa de carregar a dose — controla o estado fallback
  // do card quando não há pergunta disponível.
  const [doseLoaded, setDoseLoaded] = useState(false)

  // Fita
  const [fita, setFita] = useState<Record<string, { acertou: boolean }>>({})

  // Continue
  const [continuar, setContinuar] = useState<ContinuarItem[]>([])

  // Counts
  const [counts, setCounts] = useState<Record<string, number>>({})

  // Live
  const [liveOn, setLiveOn] = useState(false)

  // Revista do mês
  const [revista, setRevista] = useState<Magazine | null>(null)

  const streakRef = useRef(0)

  useEffect(() => {
    const now = new Date()
    const formatted = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    setDateLabel(formatted.charAt(0).toUpperCase() + formatted.slice(1))
    const h = now.getHours()
    let g = 'Olá'
    if (h >= 5 && h < 12) g = 'Bom dia'
    else if (h >= 12 && h < 18) g = 'Boa tarde'
    else g = 'Boa noite'
    const first = (user?.name || '').split(' ')[0] || 'estudante'
    setGreeting(`${g}, ${first}`)
  }, [user?.name])

  // Streak
  useEffect(() => {
    if (!user) return
    getSequencia(user.id).then((s) => {
      const prev = streakRef.current
      streakRef.current = s.sequencia_atual
      setPrevStreak(prev)
      setStreak(s.sequencia_atual)
      if (s.sequencia_atual > prev && prev !== 0) setBounceKey((k) => k + 1)
    })
  }, [user])

  // Dose
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const d = await getDoseDoDia(user.id)
        if (cancelled) return
        setDose(d)
        if (!d.question_id) return
        const q = await getDoseQuestion(d.question_id)
        if (cancelled || !q) return
        setQuestion(q)
        // Simulado name
        try {
          const sim = await pb.collection('simulados').getOne<Simulado>(q.simulado)
          if (!cancelled) setSimuladoName(sim?.title || 'Simulado')
        } catch {
          if (!cancelled) setSimuladoName('Simulado')
        }
        if (d.answered) {
          // Already answered today — show the locked/answered state.
          setRevealed(true)
          setLocked(true)
          if (d.acertou !== undefined) {
            // We don't store which option the user picked, so just reveal the correct.
            setSelected(null)
          }
        }
      } finally {
        // Mesmo que a chamada falhe ou retorne question_id vazio, sinaliza
        // que a carga terminou para o card fallback aparecer no lugar.
        if (!cancelled) setDoseLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  // Fita da semana
  useEffect(() => {
    if (!user) return
    getFitaSemana(user.id).then((f) => {
      const map: Record<string, { acertou: boolean }> = {}
      for (const k of Object.keys(f)) map[k] = { acertou: f[k].acertou }
      setFita(map)
    })
  }, [user])

  // Continue de onde parou
  useEffect(() => {
    if (!user) return
    getContinueDeOndeParou(user.id)
      .then(setContinuar)
      .catch(() => setContinuar([]))
  }, [user])

  // Counts + live + revista + agora
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const c: Record<string, number> = {}
      try {
        c.cursos = (await getCourses()).length
      } catch {
        /* noop */
      }
      try {
        c.simulados = (await getSimulados(true)).length
      } catch {
        /* noop */
      }
      try {
        c.revistas = (await getMagazines()).length
      } catch {
        /* noop */
      }
      try {
        c.mentorias = (await getMentorships()).length
      } catch {
        /* noop */
      }
      try {
        c.documentarios = (await getDocProjects()).length
      } catch {
        /* noop */
      }
      try {
        c.lives = (
          await pb
            .collection('live_sessions')
            .getFullList({ filter: 'status="scheduled" || status="live"' })
        ).length
      } catch {
        /* noop */
      }
      try {
        c.caderno = (await getStudentNotes(user!.id)).length
      } catch {
        /* noop */
      }
      try {
        c.agora = (await getDebates('status != "encerrado"')).length
      } catch {
        /* noop */
      }
      // Live on?
      try {
        const live = await pb.collection('live_sessions').getFullList({ filter: 'status="live"' })
        if (live.length > 0) setLiveOn(true)
      } catch {
        /* noop */
      }
      if (cancelled) return
      setCounts(c)
    })()
    getRevistaDoMes()
      .then(setRevista)
      .catch(() => setRevista(null))
    return () => {
      cancelled = true
    }
  }, [user])

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const handleAnswer = async (option: string) => {
    if (locked || !question) return
    setSelected(option)
    setLocked(true)
    setRevealed(true)
    const correct = question.correct_option
    if (!user || !dose) return
    const res = await responderDose(user.id, dose.pergunta_id, dose.question_id, option, correct)
    if (res) {
      // Refresh streak + fita and bounce the number.
      const seq = await getSequencia(user.id)
      const prev = streakRef.current
      streakRef.current = seq.sequencia_atual
      setPrevStreak(prev)
      setStreak(seq.sequencia_atual)
      if (seq.sequencia_atual > prev) setBounceKey((k) => k + 1)
      getFitaSemana(user.id).then((f) => {
        const map: Record<string, { acertou: boolean }> = {}
        for (const k of Object.keys(f)) map[k] = { acertou: f[k].acertou }
        setFita(map)
      })
      toast({
        title: res.acertou ? 'Você acertou!' : 'Quase lá!',
        description: res.acertou
          ? `Sequência: ${seq.sequencia_atual} dias.`
          : 'A resposta certa está destacada em verde.',
      })
    }
  }

  const fitaDays = useMemo(() => {
    // Build the last 7 days Monday-first aligned to this week (Mon..Sun).
    const now = new Date()
    const day = now.getDay() // 0=Sun..6=Sat
    const monday = new Date(now)
    const diff = day === 0 ? -6 : 1 - day
    monday.setDate(now.getDate() + diff)
    const arr: { label: string; iso: string; state: 'done' | 'today' | 'future' | 'missed' }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const iso = d.toISOString().slice(0, 10)
      let state: 'done' | 'today' | 'future' | 'missed' = 'future'
      const isToday = iso === todayIso
      const answeredToday = dose?.answered
      if (fita[iso]) state = 'done'
      else if (isToday) state = answeredToday ? 'done' : 'today'
      else if (d < now && !fita[iso]) {
        // Past day without an answer — only mark missed if the user has any
        // history (otherwise we don't shame a brand-new user).
        state = Object.keys(fita).length > 0 || streak > 0 ? 'missed' : 'future'
      }
      arr.push({ label: WEEKDAYS[i], iso, state })
    }
    return arr
  }, [fita, todayIso, dose, streak])

  return (
    <div className="px-5 pt-6">
      {/* Header */}
      <header className="flex items-start justify-between mb-6">
        <div className="min-w-0">
          <p
            className="sst-caption"
            style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11.5 }}
          >
            {dateLabel}
          </p>
          <h1 className="sst-display" style={{ fontSize: 19, lineHeight: 1.15, marginTop: 4 }}>
            {greeting}
          </h1>
        </div>
        <div
          className="sst-pill flex items-center gap-1.5 shrink-0"
          style={{
            backgroundColor: 'var(--sst-card)',
            boxShadow: 'var(--sst-shadow-card)',
            padding: '6px 12px',
          }}
        >
          <Flame style={{ width: 16, height: 16, color: 'var(--sst-amber)' }} strokeWidth={1.75} />
          <span
            key={bounceKey}
            className={bounceKey ? 'sst-bounce' : ''}
            style={{
              fontFamily: 'var(--sst-font-display)',
              fontWeight: 800,
              fontSize: 15,
              color: 'var(--sst-text)',
            }}
          >
            {streak}
          </span>
        </div>
      </header>

      {/* Dose do dia */}
      {question ? (
        <DoseCard
          question={question}
          simuladoName={simuladoName}
          selected={selected}
          correct={question.correct_option}
          revealed={revealed}
          locked={locked}
          alreadyAnswered={!!dose?.answered}
          onAnswer={handleAnswer}
        />
      ) : doseLoaded ? (
        <DoseEmptyCard />
      ) : null}

      {/* Fita da semana */}
      <section className="sst-cascade" style={{ ['--sst-i' as any]: 1, marginTop: 24 }}>
        <p className="sst-label" style={{ marginBottom: 10 }}>
          Fita da semana
        </p>
        <div className="flex items-center justify-between" style={{ gap: 6 }}>
          {fitaDays.map((d) => (
            <div key={d.iso} className="flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 9,
                  backgroundColor:
                    d.state === 'done'
                      ? 'var(--sst-green)'
                      : d.state === 'today'
                        ? 'var(--sst-amber)'
                        : 'var(--sst-line-soft)',
                  boxShadow: d.state === 'today' ? '0 0 0 4px var(--sst-amber-wash)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {d.state === 'done' && (
                  <Check style={{ width: 14, height: 14, color: '#fff' }} strokeWidth={3} />
                )}
              </div>
              <span style={{ fontSize: 9.5, color: 'var(--sst-text-2)' }}>{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Continue de onde parou */}
      {continuar.length > 0 && (
        <section className="sst-cascade" style={{ ['--sst-i' as any]: 2, marginTop: 24 }}>
          <p className="sst-label" style={{ marginBottom: 10 }}>
            Continue de onde parou
          </p>
          <div
            className="sst-snap sst-no-scrollbar flex gap-3 overflow-x-auto"
            style={{ marginLeft: -20, paddingLeft: 20, paddingRight: 20, paddingBottom: 4 }}
          >
            {continuar.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(moduleRoute(c))}
                className="sst-tap sst-card text-left shrink-0"
                style={{ width: 218, padding: 14 }}
              >
                <p className="sst-label" style={{ color: stripVar(c.cor) }}>
                  {c.categoria}
                </p>
                <p
                  className="sst-card-title"
                  style={{
                    marginTop: 6,
                    marginBottom: 8,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {c.titulo}
                </p>
                <p className="sst-caption" style={{ marginBottom: 8 }}>
                  {c.ponto}
                </p>
                <div
                  style={{
                    height: 6,
                    backgroundColor: 'var(--sst-line)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${c.progresso}%`,
                      height: '100%',
                      backgroundColor: c.cor,
                      borderRadius: 999,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Sua plataforma */}
      <section className="sst-cascade" style={{ ['--sst-i' as any]: 3, marginTop: 24 }}>
        <p className="sst-label" style={{ marginBottom: 10 }}>
          Sua plataforma
        </p>
        <div className="grid grid-cols-2 gap-3">
          {MODULES.map((m) => {
            const count = counts[m.key]
            return (
              <button
                key={m.key}
                onClick={() => navigate(m.to)}
                className="sst-tap sst-card relative text-left"
                style={{ padding: 14 }}
              >
                {typeof count === 'number' && count > 0 && (
                  <span
                    className="sst-pill absolute"
                    style={{
                      top: 10,
                      right: 10,
                      backgroundColor: 'var(--sst-line-soft)',
                      color: 'var(--sst-text-2)',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 8px',
                    }}
                  >
                    {count}
                  </span>
                )}
                {m.key === 'lives' && liveOn && (
                  <span
                    className="sst-pill absolute flex items-center gap-1"
                    style={{
                      top: 10,
                      right: 10,
                      backgroundColor: '#fdeaea',
                      color: 'var(--sst-red)',
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                    }}
                  >
                    <span
                      className="sst-live-dot"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        backgroundColor: 'var(--sst-red)',
                      }}
                    />
                    AO VIVO
                  </span>
                )}
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: m.wash,
                    marginBottom: 10,
                  }}
                >
                  <m.icon style={{ width: 20, height: 20, color: m.color }} strokeWidth={1.75} />
                </div>
                <p className="sst-card-title">{m.label}</p>
                <p className="sst-caption" style={{ marginTop: 2 }}>
                  {m.desc}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Revista do mês */}
      {revista && (
        <section className="sst-cascade" style={{ ['--sst-i' as any]: 4, marginTop: 24 }}>
          <p className="sst-label" style={{ marginBottom: 10 }}>
            Revista do mês
          </p>
          <div
            className="relative overflow-hidden"
            style={{
              backgroundColor: 'var(--sst-text)',
              borderRadius: 'var(--sst-r-card-lg)',
              padding: 18,
              color: '#fff',
            }}
          >
            <p
              style={{
                color: 'var(--sst-amber)',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Edição do mês
            </p>
            <p className="sst-display" style={{ fontSize: 20, marginTop: 6, marginBottom: 8 }}>
              {revista.title}
            </p>
            <p
              style={{
                color: 'rgba(255,255,255,0.72)',
                fontSize: 13,
                lineHeight: 1.45,
                marginBottom: 16,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {revista.summary || 'Leia a nova edição completa da revista Educação SST.'}
            </p>
            <a
              href={revista.fliphtml5_link || '#'}
              target="_blank"
              rel="noreferrer"
              className="sst-tap inline-flex items-center gap-2"
              style={{
                backgroundColor: 'var(--sst-amber)',
                color: 'var(--sst-text)',
                borderRadius: 'var(--sst-r-btn)',
                padding: '10px 16px',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Ler agora <ArrowRight style={{ width: 15, height: 15 }} strokeWidth={2} />
            </a>
          </div>
        </section>
      )}
    </div>
  )
}

function moduleRoute(c: ContinuarItem): string {
  if (c.categoria === 'Simulado') return `/plataforma/simulados/${c.id.replace('sim-', '')}`
  if (c.categoria === 'Revista') return `/plataforma/revista/${c.id.replace('rev-', '')}`
  return `/plataforma/documentarios`
}

// Turn "var(--sst-amber)" into "#FFC220" for the tiny label (CSS vars don't
// work inside the label color attr fallback reliably in some browsers when
// inherited from a button). We just return the var string — modern browsers
// support it fine.
function stripVar(s: string): string {
  return s
}

// ---------------------------------------------------------------------------
// Dose do dia card
// ---------------------------------------------------------------------------

interface DoseCardProps {
  question: SimuladoQuestion
  simuladoName: string
  selected: string | null
  correct: string
  revealed: boolean
  locked: boolean
  alreadyAnswered: boolean
  onAnswer: (option: string) => void
}

function DoseCard({
  question,
  simuladoName,
  selected,
  correct,
  revealed,
  locked,
  alreadyAnswered,
  onAnswer,
}: DoseCardProps) {
  const options: string[] = Array.isArray(question.options) ? question.options : []
  return (
    <section
      className="sst-cascade relative overflow-hidden"
      style={{
        ['--sst-i' as any]: 0,
        backgroundColor: 'var(--sst-amber)',
        borderRadius: 'var(--sst-r-card-lg)',
        padding: 20,
        boxShadow: 'var(--sst-shadow-dose)',
      }}
    >
      {/* Translucent white circle emerging from top-right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 150,
          height: 150,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.18)',
        }}
      />
      <p
        style={{
          color: 'var(--sst-amber-ink)',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Dose do dia · {simuladoName}
      </p>
      <p
        className="sst-display"
        style={{
          fontSize: 17.5,
          lineHeight: 1.3,
          marginTop: 8,
          marginBottom: 16,
          color: 'var(--sst-text)',
        }}
      >
        {question.question}
      </p>
      <div className="flex flex-col gap-2.5">
        {options.map((opt, i) => {
          const isCorrect = revealed && opt === correct
          const isWrongChosen = revealed && selected === opt && opt !== correct
          return (
            <button
              key={i}
              disabled={locked && !alreadyAnswered ? false : locked}
              onClick={() => onAnswer(opt)}
              className="sst-tap text-left"
              style={{
                borderRadius: 14,
                padding: '12px 14px',
                backgroundColor: 'rgba(255,255,255,0.92)',
                border: `2px solid ${isCorrect ? 'var(--sst-green)' : isWrongChosen ? '#ef4444' : 'rgba(255,255,255,0.4)'}`,
                color: 'var(--sst-text)',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  border: '2px solid var(--sst-line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--sst-text-2)',
                  flexShrink: 0,
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
              {isCorrect && (
                <Check
                  style={{ width: 16, height: 16, color: 'var(--sst-green)' }}
                  strokeWidth={2.5}
                />
              )}
            </button>
          )
        })}
      </div>
      {revealed && question.comment && (
        <div
          className="sst-page-enter"
          style={{
            marginTop: 12,
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: 14,
            color: 'var(--sst-text)',
            fontSize: 12.5,
            lineHeight: 1.5,
          }}
        >
          <p className="sst-label" style={{ marginBottom: 6 }}>
            Comentário
          </p>
          {question.comment}
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Dose do dia — estado fallback quando não há pergunta disponível
// (backend indisponível ou nenhuma questão liberada para o dia).
// Mantém o mesmo visual do card (fundo âmbar) em vez de sumir da tela.
// ---------------------------------------------------------------------------

function DoseEmptyCard() {
  return (
    <section
      className="sst-cascade relative overflow-hidden"
      style={{
        ['--sst-i' as any]: 0,
        backgroundColor: 'var(--sst-amber)',
        borderRadius: 'var(--sst-r-card-lg)',
        padding: 20,
        boxShadow: 'var(--sst-shadow-dose)',
      }}
    >
      {/* Translucent white circle emerging from top-right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 150,
          height: 150,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.18)',
        }}
      />
      <p
        style={{
          color: 'var(--sst-amber-ink)',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Dose do dia
      </p>
      <div className="flex items-center gap-3" style={{ marginTop: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            backgroundColor: 'rgba(255,255,255,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Hourglass
            style={{ width: 24, height: 24, color: 'var(--sst-text)' }}
            strokeWidth={1.75}
          />
        </div>
        <div>
          <p
            className="sst-display"
            style={{
              fontSize: 16,
              lineHeight: 1.3,
              color: 'var(--sst-text)',
            }}
          >
            Sua dose de amanhã já está sendo preparada
          </p>
          <p
            style={{
              marginTop: 4,
              fontSize: 12.5,
              lineHeight: 1.4,
              color: 'var(--sst-amber-ink)',
            }}
          >
            Volte amanhã para uma nova questão
          </p>
        </div>
      </div>
    </section>
  )
}
