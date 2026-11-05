import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  INSTAGRAM_REVISTA,
  isInscricoesEncerradas,
  MSG_INSCRICOES_ENCERRADAS,
  REGULAMENTO_RESUMO,
} from '@/lib/dia-tst'
import { getParceirosDiaTst, DiaTstPartner } from '@/services/dia_tst'
import { BACKEND_URL } from '@/lib/constants'
import InscricaoForm, { FormularioInscricao } from '@/components/dia-tst/InscricaoForm'
import StoryCapa from '@/components/dia-tst/StoryCapa'
import PosteMarque from '@/components/dia-tst/PosteMarque'
import { ChevronDown } from 'lucide-react'

const PASSOS = [
  { n: 1, t: 'Inscreva-se', d: 'Preencha seus dados e conte por que você escolheu ser TST.' },
  { n: 2, t: 'Monte a capa', d: 'Escolha a foto e gere a imagem do story no seu aparelho.' },
  { n: 3, t: 'Poste e marque', d: 'Publique nos stories e marque a Revista Educação SST.' },
]

function FaixaListrada({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-2 w-full ${className}`}
      style={{
        background: 'repeating-linear-gradient(115deg, #F97316 0 26px, #173F33 26px 52px)',
      }}
    />
  )
}

export default function DiaDoTst() {
  const location = useLocation()
  const [inscrito, setInscrito] = useState(false)
  const [dadosInscricao, setDadosInscricao] = useState<FormularioInscricao | null>(null)
  const [jaInscrito, setJaInscrito] = useState(false)
  const [parceiros, setParceiros] = useState<DiaTstPartner[]>([])
  const etapa2Ref = useRef<HTMLDivElement>(null)
  const encerrado = useMemo(() => isInscricoesEncerradas(), [])

  useEffect(() => {
    document.title = 'Sou Educação SST — Dia do TST'
    const meta = document.querySelector('meta[name="description"]')
    if (meta)
      meta.setAttribute(
        'content',
        'Conte por que você escolheu ser TST, monte sua capa e concorra a livros e EPIs.',
      )
  }, [])

  useEffect(() => {
    getParceirosDiaTst().then(setParceiros)
  }, [])

  // origem = utm_source da URL
  useEffect(() => {
    const utm = new URLSearchParams(location.search).get('utm_source')
    if (utm) sessionStorage.setItem('dia_tst_utm', utm)
  }, [location.search])

  const aoConfirmar = (dados: FormularioInscricao, jaExistia = false) => {
    setDadosInscricao(dados)
    setInscrito(true)
    if (jaExistia) setJaInscrito(true)
    setTimeout(() => etapa2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
  }

  // A capa fica liberada após a inscrição — e também quando o prazo acabou.
  const capaLiberada = inscrito || encerrado

  const pbUrl = BACKEND_URL

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C1B18]">
      <FaixaListrada />

      {/* Cabeçalho */}
      <header className="mx-auto max-w-2xl px-4 pt-8 pb-6 text-center">
        <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-laranja">
          27 de novembro · Dia do Técnico em Segurança do Trabalho
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none">
          Sou <span className="text-verde-escuro">Educação SST</span>
        </h1>
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-ink/75">
          Concurso cultural da Revista Educação SST para quem faz a prevenção acontecer todos os
          dias. Conte por que você escolheu ser TST, monte sua capa e poste nos stories. As frases
          mais marcantes ganham livros, EPIs e produtos oferecidos pelos nossos parceiros.
        </p>

        {/* Três passos */}
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {PASSOS.map((p) => (
            <div
              key={p.n}
              className="rounded-xl border border-verde-escuro/15 bg-white p-4 text-left shadow-sm"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-laranja text-sm font-bold text-white">
                {p.n}
              </span>
              <p className="mt-2 font-bold text-verde-escuro">{p.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/60">{p.d}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Faixa de parceiros (só aparece se houver logos cadastrados) */}
      {parceiros.length > 0 && (
        <section className="mx-auto max-w-2xl px-4 pb-4">
          <div className="rounded-xl border border-verde-escuro/15 bg-white p-4">
            <p className="text-center text-[11px] uppercase tracking-widest font-semibold text-ink/50">
              Prêmios oferecidos por
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-5">
              {parceiros.map((p) => (
                <img
                  key={p.id}
                  src={`${pbUrl}/api/files/dia_tst_partners/${p.id}/${p.logo}`}
                  alt={p.nome}
                  title={p.nome}
                  className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-2xl px-4 pb-16 space-y-6">
        {encerrado ? (
          <div className="rounded-2xl border-2 border-laranja/40 bg-white p-6 text-center">
            <p className="text-lg font-bold text-verde-escuro">{MSG_INSCRICOES_ENCERRADAS}</p>
            <p className="mt-2 text-sm text-ink/70">
              A montagem da capa continua disponível abaixo.
            </p>
          </div>
        ) : (
          <SecaoEtapa numero={1} titulo="Sua inscrição">
            <InscricaoForm aberto={!inscrito} onSucesso={aoConfirmar} />
          </SecaoEtapa>
        )}

        <div ref={etapa2Ref}>
          <SecaoEtapa numero={2} titulo="Monte sua capa" esmaecida={!capaLiberada}>
            {jaInscrito && (
              <div className="mb-4 rounded-lg bg-laranja/10 border border-laranja/30 px-4 py-3 text-sm text-laranja-escuro font-medium">
                Este e-mail já está inscrito. Você pode montar sua capa normalmente.
              </div>
            )}
            {!capaLiberada && (
              <p className="mb-4 text-sm text-ink/60">
                Confirme sua inscrição na etapa 1 para liberar a montagem da capa.
              </p>
            )}
            <div className={capaLiberada ? '' : 'pointer-events-none select-none opacity-40'}>
              <StoryCapa
                nome={dadosInscricao?.nome || ''}
                cidadeUf={dadosInscricao?.cidade_uf || ''}
                instagramRevista={INSTAGRAM_REVISTA}
              />
            </div>
          </SecaoEtapa>
        </div>

        <SecaoEtapa numero={3} titulo="Poste e marque">
          <PosteMarque />
        </SecaoEtapa>

        {/* Rodapé: regulamento resumido expansível */}
        <details className="group rounded-2xl border border-verde-escuro/15 bg-white p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-verde-escuro">
            Regulamento — resumo
            <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink/75 list-disc pl-4">
            {REGULAMENTO_RESUMO.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink/50">Revista Educação SST · ISSN 2966-3849</p>
        </details>
      </main>

      <FaixaListrada />
      <footer className="py-6 text-center text-xs text-ink/50 bg-[#FAF8F3]">
        Revista Educação SST · ISSN 2966-3849
      </footer>
    </div>
  )
}

function SecaoEtapa({
  numero,
  titulo,
  esmaecida = false,
  children,
}: {
  numero: number
  titulo: string
  esmaecida?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className={`rounded-2xl border bg-white p-5 sm:p-7 shadow-sm transition-opacity ${
        esmaecida ? 'opacity-70 border-verde-escuro/10' : 'border-verde-escuro/20'
      }`}
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-verde-escuro text-lg font-bold text-white">
          {numero}
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-verde-escuro">{titulo}</h2>
      </div>
      {children}
    </section>
  )
}
