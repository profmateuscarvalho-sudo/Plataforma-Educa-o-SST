import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, MessageCircle, Share2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import pb from '@/lib/pocketbase/client'
import { setMetaTags, stripHtml } from '@/lib/utils'
import {
  getSimulado,
  getSimuladoQuestions,
  submitSimuladoCompletion,
  incrementSimuladoAccess,
} from '@/services/simulados'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
  const { user } = useAuth()
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
        navigate('/simulados')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

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
        submitSimuladoCompletion(simulado.id, user?.id)
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">Resultado do Simulado</h2>
            <p className="text-lg text-slate-600">{simulado.title}</p>

            <div className="py-8">
              <div className="text-6xl font-black text-primary mb-2">{percentage}%</div>
              <p className="text-slate-500 text-lg">
                Você acertou {score} de {questions.length} questões!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button variant="outline" size="lg" onClick={() => navigate('/simulados')}>
                Voltar aos Simulados
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  setAnswers({})
                  setCurrentIndex(0)
                  setShowResults(false)
                }}
              >
                Refazer Simulado
              </Button>
            </div>

            <div className="pt-6 border-t mt-8">
              <p className="text-sm font-medium text-slate-500 mb-4">Compartilhe seu resultado</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border-[#25D366]/20"
                  onClick={() => window.open(waLink, '_blank')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 border-[#0A66C2]/20"
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/simulados')}
            className="text-slate-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Sair
          </Button>
          <div className="font-semibold text-slate-800 hidden md:block">{simulado.title}</div>
          <div className="text-sm font-medium text-slate-500">
            Questão {currentIndex + 1} de {questions.length}
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
            {currentIndex + 1}. {currentQ.question}
          </h2>
        </div>

        <div className="space-y-3 mb-12">
          {currentQ.options.map((opt, idx) => {
            const hasAnswered = !!answers[currentQ.id]
            const isSelected = answers[currentQ.id] === opt
            const isCorrect = opt === currentQ.correct_option
            const showAsCorrect = hasAnswered && isCorrect
            const showAsIncorrect = hasAnswered && isSelected && !isCorrect

            let btnClass =
              'w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all duration-200 text-lg flex items-center justify-between '
            if (!hasAnswered) {
              btnClass +=
                'border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50 cursor-pointer'
            } else {
              btnClass += 'cursor-default '
              if (showAsCorrect) {
                btnClass += 'border-green-500 bg-green-50 text-green-700 shadow-sm'
              } else if (showAsIncorrect) {
                btnClass += 'border-red-500 bg-red-50 text-red-700 shadow-sm'
              } else {
                btnClass += 'border-slate-200 bg-white opacity-50'
              }
            }

            let letterClass =
              'w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors '
            if (!hasAnswered) {
              letterClass += 'border-slate-300 text-slate-500 bg-white'
            } else {
              if (showAsCorrect) {
                letterClass += 'border-green-500 bg-green-500 text-white'
              } else if (showAsIncorrect) {
                letterClass += 'border-red-500 bg-red-500 text-white'
              } else {
                letterClass += 'border-slate-300 text-slate-400 bg-slate-100'
              }
            }

            return (
              <button
                key={idx}
                onClick={() => !hasAnswered && handleSelectOption(currentQ.id, opt)}
                disabled={hasAnswered}
                className={btnClass}
              >
                <div className="flex items-center gap-4">
                  <div className={letterClass}>{String.fromCharCode(65 + idx)}</div>
                  <span
                    className={cn(
                      'flex-1',
                      hasAnswered
                        ? showAsCorrect
                          ? 'text-green-800 font-medium'
                          : showAsIncorrect
                            ? 'text-red-800 font-medium'
                            : 'text-slate-500'
                        : 'text-slate-700',
                    )}
                  >
                    {opt}
                  </span>
                </div>
                {showAsCorrect && <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />}
                {showAsIncorrect && <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />}
              </button>
            )
          })}
        </div>

        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm sticky bottom-4">
          <Button variant="ghost" onClick={handlePrev} disabled={currentIndex === 0}>
            Anterior
          </Button>
          <Button size="lg" onClick={handleNext} disabled={!hasAnsweredCurrent} className="px-8">
            {currentIndex === questions.length - 1 ? 'Finalizar' : 'Próxima'}
          </Button>
        </div>
      </main>
    </div>
  )
}
