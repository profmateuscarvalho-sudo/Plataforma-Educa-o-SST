import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  Lightbulb,
  MessageCircle,
  Share2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import pb from '@/lib/pocketbase/client'
import { setMetaTags, stripHtml, cn } from '@/lib/utils'
import {
  getSimulado,
  getSimuladoQuestions,
  submitSimuladoCompletion,
  incrementSimuladoAccess,
} from '@/services/simulados'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import type { Simulado, SimuladoQuestion } from '@/types'

const injectOGTags = (title: string, desc: string, image: string, url: string) => {
  document.title = title
  const updateMeta = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('property', property)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }
  updateMeta('og:title', title)
  updateMeta('og:description', desc)
  updateMeta('og:image', image)
  updateMeta('og:url', url)
  updateMeta('og:type', 'website')
}

export default function SimuladoSession() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const backPath = location.pathname.includes('/plataforma/')
    ? '/plataforma/simulados'
    : '/simulados'
  const [simulado, setSimulado] = useState<Simulado | null>(null)
  const [questions, setQuestions] = useState<SimuladoQuestion[]>([])
  const [loading, setLoading] = useState(true)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([getSimulado(id), getSimuladoQuestions(id)])
      .then(([s, qs]) => {
        setSimulado(s)
        setQuestions(qs)
        incrementSimuladoAccess(s.id)

        let plainText = s.description ? stripHtml(s.description) : ''
        if (plainText.length > 180) {
          plainText = plainText.substring(0, 180) + '...'
        }

        const bannerUrl = s.banner
          ? pb.files.getUrl(s, s.banner)
          : 'https://img.usecurling.com/p/1200/600?q=education&color=blue'

        setMetaTags({
          title: `Simulado: ${s.title}`,
          description: plainText || 'Teste seus conhecimentos em Segurança e Saúde no Trabalho.',
          image: bannerUrl,
          url: window.location.href,
        })
        injectOGTags(
          `Simulado: ${s.title}`,
          plainText || 'Teste seus conhecimentos em Segurança e Saúde no Trabalho.',
          bannerUrl,
          window.location.href,
        )
      })
      .catch(() => {
        toast.error('Erro ao carregar o simulado')
        navigate(backPath)
      })
      .finally(() => setLoading(false))
  }, [id, navigate, backPath])

  const handleSelectOption = (questionId: string, option: string) => {
    if (!answers[questionId]) {
      setAnswers((prev) => ({ ...prev, [questionId]: option }))
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      window.scrollTo(0, 0)
    } else {
      setShowResults(true)
      if (simulado) {
        const score = questions.reduce(
          (acc, q) => acc + (answers[q.id] === q.correct_option ? 1 : 0),
          0,
        )
        submitSimuladoCompletion(simulado.id, user?.id, score, questions.length)
      }
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  if (loading)
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  if (!simulado || questions.length === 0)
    return <div className="p-8 text-center">Nenhuma questão disponível neste simulado.</div>

  const progress = ((currentIndex + 1) / questions.length) * 100

  if (showResults) {
    let score = 0
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) score++
    })
    const percentage = Math.round((score / questions.length) * 100)

    const shareUrl = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/share/simulados/${simulado.id}`
    const shareText = `Eu acabei de marcar ${percentage}% no simulado ${simulado.title}! Confira em: ${shareUrl}`
    const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    const liLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-card text-card-foreground border border-border rounded-[28px] shadow-none">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-primary/20 text-foreground rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-foreground" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">
              Resultado do Simulado
            </h2>
            <p className="text-base text-muted-foreground">{simulado.title}</p>

            <div className="py-6">
              <div className="text-6xl font-serif font-semibold text-foreground mb-2">
                {percentage}%
              </div>
              <p className="text-muted-foreground text-sm">
                Você acertou <strong className="text-foreground">{score}</strong> de{' '}
                {questions.length} questões!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                onClick={() => navigate(backPath)}
                className="border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-muted min-h-[52px] px-8 rounded-full font-semibold"
              >
                Voltar aos Simulados
              </Button>
              <Button
                onClick={() => {
                  setAnswers({})
                  setCurrentIndex(0)
                  setShowResults(false)
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[52px] px-8 rounded-full font-semibold"
              >
                Refazer Simulado
              </Button>
            </div>

            <div className="pt-6 border-t border-border mt-8">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-4">
                Compartilhe seu resultado
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  className="rounded-full min-h-[44px] px-6 border-border bg-card text-foreground hover:bg-muted"
                  onClick={() => window.open(waLink, '_blank')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full min-h-[44px] px-6 border-border bg-card text-foreground hover:bg-muted"
                  onClick={() => window.open(liLink, '_blank')}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const hasAnsweredCurrent = !!answers[currentQ.id]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="bg-card/90 border-b border-border sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backPath)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full min-h-[40px] px-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Sair
          </Button>
          <div className="font-serif font-semibold text-foreground hidden md:block">
            {simulado.title}
          </div>
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Questão {currentIndex + 1} de {questions.length}
          </div>
        </div>
        <Progress value={progress} className="h-1.5 rounded-none bg-muted" />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <Card className="mb-8 border border-border bg-card text-card-foreground rounded-[28px] shadow-none">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {currentIndex + 1}
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Questão
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground leading-relaxed">
              {currentQ.question}
            </h2>
          </CardContent>
        </Card>
        <div className="space-y-3 mb-8">
          {currentQ.options.map((opt, idx) => {
            const hasAnswered = !!answers[currentQ.id]
            const isSelected = answers[currentQ.id] === opt
            const isCorrect = opt === currentQ.correct_option
            const showAsCorrect = hasAnswered && isCorrect
            const showAsIncorrect = hasAnswered && isSelected && !isCorrect

            let btnClass =
              'w-full text-left min-h-[52px] p-4 md:p-5 rounded-[18px] border transition-all text-sm md:text-base flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring '
            if (!hasAnswered) {
              btnClass +=
                'border-border bg-card hover:border-foreground/30 hover:bg-muted/60 text-foreground cursor-pointer'
            } else {
              btnClass += 'cursor-default '
              if (showAsCorrect) {
                btnClass +=
                  'border-[#1F6B4A] bg-[#E3F1E9] text-[#1F6B4A] dark:bg-[#1F6B4A]/20 dark:border-[#1F6B4A] dark:text-[#E3F1E9] font-semibold'
              } else if (showAsIncorrect) {
                btnClass +=
                  'border-[#B4472E] bg-[#FAE7E1] text-[#B4472E] dark:bg-[#B4472E]/20 dark:border-[#B4472E] dark:text-[#FAE7E1]'
              } else {
                btnClass += 'border-border bg-card text-muted-foreground opacity-55'
              }
            }

            let letterClass =
              'w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 transition-colors '
            if (!hasAnswered) {
              letterClass += 'border-border text-foreground bg-muted'
            } else {
              if (showAsCorrect) {
                letterClass += 'border-[#1F6B4A] bg-[#1F6B4A] text-white'
              } else if (showAsIncorrect) {
                letterClass += 'border-[#B4472E] bg-[#B4472E] text-white'
              } else {
                letterClass += 'border-border text-muted-foreground bg-muted'
              }
            }

            return (
              <button
                key={idx}
                onClick={() => !hasAnswered && handleSelectOption(currentQ.id, opt)}
                disabled={hasAnswered}
                className={btnClass}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 mr-3">
                  <div className={letterClass}>{String.fromCharCode(65 + idx)}</div>
                  <span className="flex-1 leading-relaxed">{opt}</span>
                </div>
                {showAsCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-[#1F6B4A] dark:text-[#E3F1E9] shrink-0" />
                )}
                {showAsIncorrect && (
                  <XCircle className="w-5 h-5 text-[#B4472E] dark:text-[#FAE7E1] shrink-0" />
                )}
              </button>
            )
          })}
        </div>
        {hasAnsweredCurrent && currentQ.comment && (
          <div className="mb-10 p-5 rounded-[22px] bg-muted/60 border border-border text-foreground flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm leading-relaxed">
              <span className="font-serif font-semibold text-foreground block">Explicação:</span>
              <p className="text-muted-foreground whitespace-pre-wrap">{currentQ.comment}</p>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center bg-card text-card-foreground p-4 rounded-full border border-border sticky bottom-4">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="rounded-full min-h-[44px] px-6 text-foreground hover:bg-muted"
          >
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={!hasAnsweredCurrent}
            className="rounded-full min-h-[44px] px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {currentIndex === questions.length - 1 ? 'Finalizar' : 'Próxima'}
          </Button>
        </div>
      </main>
    </div>
  )
}
