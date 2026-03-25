import { useState, useEffect } from 'react'
import { Quiz, QuizQuestion } from '@/types'
import { getQuizQuestions } from '@/services/curriculum'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, RotateCcw, Medal } from 'lucide-react'

export function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getQuizQuestions(quiz.id).then((res) => {
      if (mounted) {
        setQuestions(res)
        setCurrentIndex(0)
        setSelectedOption('')
        setShowFeedback(false)
        setScore(0)
        setFinished(false)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [quiz.id])

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando quiz...</div>
  if (questions.length === 0)
    return (
      <div className="p-8 text-center text-slate-400">Nenhuma pergunta cadastrada neste quiz.</div>
    )

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100)
    const passed = percentage >= 70

    return (
      <div className="bg-slate-900 p-8 md:p-12 rounded-2xl border border-white/10 text-center flex flex-col items-center animate-fade-in-up">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${passed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}
        >
          <Medal className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-white mb-3">Quiz Concluído!</h2>
        <p className="text-xl text-slate-300 mb-8">
          Você acertou <strong className="text-white">{score}</strong> de {questions.length}{' '}
          perguntas ({percentage}%).
        </p>
        <Button
          size="lg"
          onClick={() => {
            setCurrentIndex(0)
            setScore(0)
            setFinished(false)
            setShowFeedback(false)
            setSelectedOption('')
          }}
        >
          <RotateCcw className="w-5 h-5 mr-2" /> Tentar Novamente
        </Button>
      </div>
    )
  }

  const q = questions[currentIndex]

  return (
    <div className="bg-slate-900 p-6 md:p-10 rounded-2xl border border-white/10 space-y-8 shadow-2xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-serif font-bold text-white mb-4">{quiz.title}</h2>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
          <span className="shrink-0">
            Questão {currentIndex + 1} de {questions.length}
          </span>
          <Progress
            value={(currentIndex / questions.length) * 100}
            className="flex-1 bg-slate-800"
          />
        </div>
      </div>

      <div className="text-xl text-slate-200 font-medium leading-relaxed">{q.question}</div>

      <RadioGroup
        value={selectedOption}
        onValueChange={setSelectedOption}
        disabled={showFeedback}
        className="space-y-4"
      >
        {q.options.map((opt, i) => {
          const isThisCorrect = i.toString() === q.correct_option
          const isSelected = selectedOption === i.toString()
          let itemClass =
            'flex items-center space-x-4 p-5 rounded-xl border border-white/5 bg-slate-800/50 transition-all cursor-pointer'

          if (showFeedback) {
            itemClass += ' cursor-default'
            if (isThisCorrect) {
              itemClass += ' border-emerald-500 bg-emerald-500/10 text-emerald-400'
            } else if (isSelected && !isThisCorrect) {
              itemClass += ' border-red-500 bg-red-500/10 text-red-400'
            } else {
              itemClass += ' opacity-40'
            }
          } else {
            itemClass += ' hover:bg-slate-800 hover:border-white/20'
            if (isSelected) {
              itemClass += ' border-primary bg-primary/10'
            }
          }

          return (
            <Label key={i} className={itemClass}>
              <RadioGroupItem
                value={i.toString()}
                className={showFeedback ? 'border-current text-current' : ''}
              />
              <span className="flex-1 text-base leading-relaxed">{opt}</span>
              {showFeedback && isThisCorrect && (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              )}
              {showFeedback && isSelected && !isThisCorrect && (
                <XCircle className="w-6 h-6 text-red-500 shrink-0" />
              )}
            </Label>
          )
        })}
      </RadioGroup>

      <div className="pt-6 border-t border-white/10 flex justify-end">
        {!showFeedback ? (
          <Button
            size="lg"
            onClick={() => {
              setShowFeedback(true)
              if (selectedOption === q.correct_option) setScore((s) => s + 1)
            }}
            disabled={!selectedOption}
            className="px-10 text-base"
          >
            Confirmar Resposta
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => {
              if (currentIndex < questions.length - 1) {
                setCurrentIndex((i) => i + 1)
                setSelectedOption('')
                setShowFeedback(false)
              } else {
                setFinished(true)
              }
            }}
            className="px-10 text-base bg-white text-slate-900 hover:bg-slate-200"
          >
            {currentIndex < questions.length - 1 ? 'Próxima Questão' : 'Ver Resultado Final'}
          </Button>
        )}
      </div>
    </div>
  )
}
