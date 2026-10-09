import pb from '@/lib/pocketbase/client'
import { SimuladoQuestion, Simulado } from '@/types'

export interface PublicDailyDose {
  question: SimuladoQuestion
  simuladoTitle: string
  themeTag: string
  options: string[]
  explanation: string
}

function parseOptions(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map((o) => String(o).trim())
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map((o) => String(o).trim())
    } catch {
      return raw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return []
}

function extractTheme(question: SimuladoQuestion, simuladoTitle?: string): string {
  const qText = question.question || ''
  const sTitle = simuladoTitle || ''
  const matchNR = (qText + ' ' + sTitle).match(/NR[- ]?(\d+)/i)
  if (matchNR) {
    return `NR-${matchNR[1]}`
  }
  if (/fatores humanos/i.test(qText) || /fatores humanos/i.test(sTitle)) {
    return 'Fatores Humanos'
  }
  if (/ergonomia/i.test(qText) || /ergonomia/i.test(sTitle)) {
    return 'Ergonomia'
  }
  if (/pcmso/i.test(qText) || /pcmso/i.test(sTitle)) {
    return 'PCMSO'
  }
  if (sTitle) {
    return sTitle.slice(0, 14)
  }
  return 'SST Geral'
}

export async function getPublicDailyDose(): Promise<PublicDailyDose | null> {
  try {
    const list = await pb.collection('simulado_questions').getFullList<SimuladoQuestion>({
      sort: 'id',
      expand: 'simulado',
    })

    if (!list || list.length === 0) return null

    // Determine deterministic "day seed" in Brasília timezone (UTC-3)
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const brt = new Date(utc - 3 * 3600000)
    const dateStr = `${brt.getUTCFullYear()}-${brt.getUTCMonth() + 1}-${brt.getUTCDate()}`

    let hash = 0
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0
    }

    // Filter questions that have valid options (at least 2, ideally 4)
    const validQuestions = list.filter((q) => {
      const opts = parseOptions(q.options)
      return opts.length >= 2 && !!q.correct_option
    })

    const pool = validQuestions.length > 0 ? validQuestions : list
    const selected = pool[hash % pool.length]
    const rawOpts = parseOptions(selected.options)
    const options = rawOpts.slice(0, 4)

    const sim = (selected.expand as any)?.simulado as Simulado | undefined
    const simuladoTitle = sim?.title || ''
    const themeTag = extractTheme(selected, simuladoTitle)

    // Fallback explanation if comment field is empty
    const explanation =
      selected.comment?.trim() ||
      `A resposta correta é "${selected.correct_option}". Critério estabelecido de acordo com as diretrizes e normas de Segurança e Saúde no Trabalho.`

    return {
      question: selected,
      simuladoTitle,
      themeTag,
      options,
      explanation,
    }
  } catch (err) {
    console.error('Erro ao carregar dose do dia pública:', err)
    return null
  }
}
