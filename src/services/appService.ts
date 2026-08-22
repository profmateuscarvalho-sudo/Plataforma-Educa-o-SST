import pb from '@/lib/pocketbase/client'
import {
  type DoseDoDia,
  type DoseRespostaResult,
  type SequenciaStats,
  type SequenciaUsuario,
  type DoseResposta,
  type Magazine,
  type ProfessionalCase,
  type Simulado,
  type SimuladoQuestion,
  type SimuladoSubmission,
} from '@/types'

// ---------------------------------------------------------------------------
// Dose do dia
// ---------------------------------------------------------------------------

/**
 * Returns the dose of the day for the given user. When the user has not yet
 * answered today, the backend selects a question and returns its id; when they
 * already answered, it returns the answer.
 */
export async function getDoseDoDia(userId: string): Promise<DoseDoDia> {
  try {
    return await pb.send('/backend/v1/dose/today', { method: 'GET' })
  } catch {
    return { answered: false, today: '', question_id: '' }
  }
}

/** Returns the full question behind a dose (option text + correct option). */
export async function getDoseQuestion(questionId: string): Promise<SimuladoQuestion | null> {
  if (!questionId) return null
  try {
    return await pb.collection('simulado_questions').getOne<SimuladoQuestion>(questionId, {
      expand: 'simulado',
    })
  } catch {
    return null
  }
}

export interface DoseAnswerPayload {
  pergunta_id?: string
  question_id?: string
  selected: string
  correct: string
}

/** Records a daily-dose answer. Definitive — one per day. */
export async function responderDose(
  _userId: string,
  perguntaId: string | undefined,
  questionId: string | undefined,
  selected: string,
  correct: string,
): Promise<DoseRespostaResult | null> {
  const body: DoseAnswerPayload = {
    pergunta_id: perguntaId,
    question_id: questionId,
    selected,
    correct,
  }
  try {
    return await pb.send('/backend/v1/dose/answer', { method: 'POST', body })
  } catch {
    return null
  }
}

/** Returns the user's streak record (current + best + last date). */
export async function getSequencia(userId: string): Promise<SequenciaStats> {
  // Prefer the backend endpoint (computed Brasília-tz date logic).
  try {
    return await pb.send('/backend/v1/dose/sequencia', { method: 'GET' })
  } catch {
    /* fall back to direct read */
  }
  try {
    const rec = await pb
      .collection('sequencia_usuario')
      .getFirstListItem<SequenciaUsuario>(`usuario_id="${userId}"`)
    return {
      sequencia_atual: rec.sequencia_atual ?? 0,
      recorde: rec.recorde ?? 0,
      ultima_data: rec.ultima_data ?? '',
    }
  } catch {
    return { sequencia_atual: 0, recorde: 0, ultima_data: '' }
  }
}

/**
 * Returns the last 7 days of dose answers (oldest first within the window),
 * keyed by the ISO date string. Used to render the weekly "fita".
 */
export async function getFitaSemana(userId: string): Promise<Record<string, DoseResposta>> {
  const today = new Date()
  const start = new Date()
  start.setDate(today.getDate() - 6)
  const from = start.toISOString().slice(0, 10)
  try {
    const list = await pb.collection('dose_respostas').getFullList<DoseResposta>({
      filter: `usuario_id="${userId}" && data>="${from}"`,
      sort: 'data',
    })
    const map: Record<string, DoseResposta> = {}
    for (const r of list) map[r.data] = r
    return map
  } catch {
    return {}
  }
}

// ---------------------------------------------------------------------------
// Simulados progress
// ---------------------------------------------------------------------------

export interface SimuladoProgresso {
  disponiveis: number
  concluidos: number
  media: number | null
  items: Array<{
    simulado: Simulado
    status: 'nao_iniciado' | 'em_progresso' | 'concluido'
    melhor: SimuladoSubmission | null
    tentativas: number
    ultima: SimuladoSubmission | null
    respondidas: number
    totalQuestoes: number
  }>
}

export async function getProgressoSimulados(userId: string): Promise<SimuladoProgresso> {
  let simulados: Simulado[] = []
  let submissions: SimuladoSubmission[] = []
  try {
    simulados = await pb.collection('simulados').getFullList<Simulado>({
      filter: 'active=true',
      sort: 'created',
    })
  } catch {
    /* noop */
  }
  try {
    submissions = await pb.collection('simulado_submissions').getFullList<SimuladoSubmission>({
      filter: `user="${userId}"`,
      sort: '-created',
      expand: 'simulado',
    })
  } catch {
    /* noop */
  }

  // Per-simulado question counts (for "in progress" detection).
  const questionCounts: Record<string, number> = {}
  for (const s of simulados) {
    try {
      const qs = await pb.collection('simulado_questions').getFullList<SimuladoQuestion>({
        filter: `simulado="${s.id}"`,
      })
      questionCounts[s.id] = qs.length
    } catch {
      questionCounts[s.id] = 0
    }
  }

  const items = simulados.map((simulado) => {
    const subs = submissions.filter((x) => x.simulado === simulado.id)
    const tentativas = subs.length
    const melhor = subs.reduce<SimuladoSubmission | null>(
      (best, cur) => (!best || (cur.percentage ?? 0) > (best.percentage ?? 0) ? cur : best),
      null,
    )
    const ultima = subs[0] ?? null
    let respondidas = 0
    // We approximate "questions answered" by the best attempt's total_questions
    // when available (the simulado session stores completion, not per-question).
    if (melhor) respondidas = melhor.total_questions ?? 0
    const totalQuestoes = questionCounts[simulado.id] ?? 0
    let status: 'nao_iniciado' | 'em_progresso' | 'concluido' = 'nao_iniciado'
    if (tentativas > 0) status = 'concluido'
    else if (respondidas > 0 && totalQuestoes > 0 && respondidas < totalQuestoes)
      status = 'em_progresso'
    return { simulado, status, melhor, tentativas, ultima, respondidas, totalQuestoes }
  })

  const concluidos = items.filter((i) => i.status === 'concluido').length
  const withScore = submissions.filter((s) => typeof s.percentage === 'number')
  const media =
    withScore.length > 0
      ? Math.round(withScore.reduce((acc, s) => acc + (s.percentage ?? 0), 0) / withScore.length)
      : null

  return {
    disponiveis: simulados.length,
    concluidos,
    media,
    items,
  }
}

// ---------------------------------------------------------------------------
// "Continue de onde parou"
// ---------------------------------------------------------------------------

export interface ContinuarItem {
  id: string
  categoria: 'Simulado' | 'Revista' | 'Documentário'
  titulo: string
  ponto: string
  progresso: number
  cor: string
}

export async function getContinueDeOndeParou(userId: string): Promise<ContinuarItem[]> {
  const items: ContinuarItem[] = []

  // Simulados in progress: completed attempts but last one under 100%, or
  // started but not finished (we approximate via completed_at presence).
  try {
    const subs = await pb.collection('simulado_submissions').getFullList<SimuladoSubmission>({
      filter: `user="${userId}"`,
      sort: '-created',
      expand: 'simulado',
    })
    // Group by simulado, keep latest per simulado.
    const latestPerSim: Record<string, SimuladoSubmission> = {}
    for (const s of subs) {
      if (!latestPerSim[s.simulado]) latestPerSim[s.simulado] = s
    }
    for (const id of Object.keys(latestPerSim)) {
      const sub = latestPerSim[id]
      const sim = sub.expand?.simulado
      if (!sim) continue
      const pct = sub.percentage ?? 0
      if (pct >= 100) continue // fully done
      items.push({
        id: `sim-${sim.id}`,
        categoria: 'Simulado',
        titulo: sim.title,
        ponto: `Questão ${(sub.score ?? 0) + 1}`,
        progresso: pct,
        cor: 'var(--sst-amber)',
      })
    }
  } catch {
    /* noop */
  }

  // Magazines started: we don't track per-page progress, so treat the most
  // recent magazine the user has opened (via access_events) as "in progress".
  try {
    const events = await pb.collection('access_events').getFullList({
      filter: `user="${userId}" && area="Revista"`,
      sort: '-created',
      requestKey: 'app-continue-revistas',
    } as any)
    const seen = new Set<string>()
    for (const e of events as any[]) {
      const meta = e.meta || {}
      const mid = meta.magazine_id || meta.id
      if (!mid || seen.has(mid)) continue
      seen.add(mid)
      try {
        const m = await pb.collection('magazines').getOne<Magazine>(mid)
        items.push({
          id: `rev-${m.id}`,
          categoria: 'Revista',
          titulo: m.title,
          ponto: 'Continuar leitura',
          progresso: 50,
          cor: 'var(--sst-purple)',
        })
      } catch {
        /* noop */
      }
      if (items.filter((i) => i.categoria === 'Revista').length >= 2) break
    }
  } catch {
    /* noop */
  }

  // Documentaries unfinished: same approach via access_events.
  try {
    const events = await pb.collection('access_events').getFullList({
      filter: `user="${userId}" && area="Documentário"`,
      sort: '-created',
      requestKey: 'app-continue-docs',
    } as any)
    const seen = new Set<string>()
    for (const e of events as any[]) {
      const meta = e.meta || {}
      const did = meta.doc_id || meta.id
      if (!did || seen.has(did)) continue
      seen.add(did)
      try {
        const d = await pb.collection('doc_projects').getOne(did)
        items.push({
          id: `doc-${d.id}`,
          categoria: 'Documentário',
          titulo: (d as any).title || 'Documentário',
          ponto: 'Continuar assistindo',
          progresso: 40,
          cor: 'var(--sst-blue)',
        })
      } catch {
        /* noop */
      }
      if (items.filter((i) => i.categoria === 'Documentário').length >= 2) break
    }
  } catch {
    /* noop */
  }

  // Keep most recent first (Simulado entries already newest-first from sort).
  return items.slice(0, 6)
}

// ---------------------------------------------------------------------------
// Cases feed (most discussed this week)
// ---------------------------------------------------------------------------

export interface CaseFeedItem extends ProfessionalCase {
  _likes: number
  _comments: number
  _order: number
}

export async function getCases(): Promise<CaseFeedItem[]> {
  // Pull approved cases from the last ~14 days, then rank by engagement
  // (likes + comments) within the last 7 days.
  const since = new Date()
  since.setDate(since.getDate() - 14)
  let cases: ProfessionalCase[] = []
  try {
    cases = await pb.collection('professional_cases').getFullList<ProfessionalCase>({
      filter: `status="approved" && created>="${since.toISOString()}"`,
      sort: '-created',
    })
  } catch {
    /* noop */
  }
  if (cases.length === 0) {
    try {
      cases = await pb.collection('professional_cases').getFullList<ProfessionalCase>({
        filter: 'status="approved"',
        sort: '-created',
      })
    } catch {
      /* noop */
    }
  }

  if (cases.length === 0) return []

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const ids = cases.map((c) => c.id)
  const likesFilter = ids
    .map((id) => `case="${id}" && created>="${weekAgo.toISOString()}"`)
    .join(' || ')
  const commentsFilter = ids
    .map((id) => `case="${id}" && created>="${weekAgo.toISOString()}"`)
    .join(' || ')

  let likes: { case: string }[] = []
  let comments: { case: string }[] = []
  try {
    likes = likesFilter
      ? await pb.collection('case_likes').getFullList({ filter: likesFilter })
      : []
  } catch {
    /* noop */
  }
  try {
    comments = commentsFilter
      ? await pb.collection('case_comments').getFullList({ filter: commentsFilter })
      : []
  } catch {
    /* noop */
  }

  const likeCount: Record<string, number> = {}
  const commentCount: Record<string, number> = {}
  for (const l of likes) likeCount[l.case] = (likeCount[l.case] || 0) + 1
  for (const c of comments) commentCount[c.case] = (commentCount[c.case] || 0) + 1

  const enriched = cases.map<CaseFeedItem>((c) => ({
    ...c,
    _likes: likeCount[c.id] || 0,
    _comments: commentCount[c.id] || 0,
    _order: 0,
  }))

  enriched.sort((a, b) => {
    const ea = a._likes + a._comments
    const eb = b._likes + b._comments
    if (eb !== ea) return eb - ea
    return (b.created || '').localeCompare(a.created || '')
  })
  enriched.forEach((c, i) => (c._order = i + 1))

  return enriched
}

// ---------------------------------------------------------------------------
// Revista do mês
// ---------------------------------------------------------------------------

export async function getRevistaDoMes(): Promise<Magazine | null> {
  try {
    const list = await pb.collection('magazines').getFullList<Magazine>({
      sort: '-created',
    })
    return list.find((m) => m.is_featured) || list[0] || null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Perfil stats
// ---------------------------------------------------------------------------

export interface PerfilStats {
  revistasLidas: number
  simuladosConcluidos: number
  anotacoesCaderno: number
  sequenciaAtual: number
  recorde: number
}

export async function getPerfilStats(userId: string): Promise<PerfilStats> {
  const seq = await getSequencia(userId)

  let anotacoesCaderno = 0
  try {
    const list = await pb.collection('student_notes').getFullList({ filter: `user="${userId}"` })
    anotacoesCaderno = list.length
  } catch {
    /* noop */
  }

  let simuladosConcluidos = 0
  try {
    const list = await pb
      .collection('simulado_submissions')
      .getFullList({ filter: `user="${userId}"` })
    simuladosConcluidos = list.length
  } catch {
    /* noop */
  }

  // Magazines read: count distinct magazine_id from access_events area=Revista.
  let revistasLidas = 0
  try {
    const events = (await pb.collection('access_events').getFullList({
      filter: `user="${userId}" && area="Revista"`,
      requestKey: 'app-perfil-revistas',
    } as any)) as any[]
    const ids = new Set<string>()
    for (const e of events) {
      const m = (e.meta || {}).magazine_id || (e.meta || {}).id
      if (m) ids.add(m)
    }
    revistasLidas = ids.size
  } catch {
    /* noop */
  }

  return {
    revistasLidas,
    simuladosConcluidos,
    anotacoesCaderno,
    sequenciaAtual: seq.sequencia_atual,
    recorde: seq.recorde,
  }
}

// ---------------------------------------------------------------------------
// Lembrete diário (reminder) preferences + push subscriptions
// ---------------------------------------------------------------------------

export async function getLembrete(userId: string): Promise<{ ativo: boolean; hora: string }> {
  try {
    const u = await pb.collection('users').getOne<any>(userId)
    return {
      ativo: !!u.lembrete_diario_ativo,
      hora: u.lembrete_diario_hora || '19:00',
    }
  } catch {
    return { ativo: true, hora: '19:00' }
  }
}

export async function setLembrete(userId: string, ativo: boolean, hora?: string): Promise<void> {
  const patch: Record<string, unknown> = { lembrete_diario_ativo: ativo }
  if (typeof hora === 'string') patch.lembrete_diario_hora = hora
  try {
    await pb.collection('users').update(userId, patch)
  } catch {
    /* noop */
  }
}

export async function subscribePush(subscription: PushSubscriptionJSON): Promise<void> {
  try {
    await pb.send('/backend/v1/push/subscribe', {
      method: 'POST',
      body: subscription as any,
    })
  } catch {
    /* noop */
  }
}
