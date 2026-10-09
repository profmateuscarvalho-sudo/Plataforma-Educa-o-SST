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

  if (loading)
    return <div className="p-8 text-center text-muted-foreground">Carregando quiz...</div>
  if (questions.length === 0)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhuma pergunta cadastrada neste quiz.
      </div>
    )

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100)
    const passed = percentage >= 70

    return (
      <div className="bg-card text-card-foreground p-8 md:p-12 rounded-[28px] border border-border text-center flex flex-col items-center animate-fade-in-up">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            passed
              ? 'bg-[#E3F1E9] text-[#1F6B4A] dark:bg-[#1F6B4A]/20 dark:text-[#E3F1E9]'
              : 'bg-primary/20 text-foreground'
          }`}
        >
          <Medal className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-serif font-semibold text-foreground mb-3">Quiz Concluído!</h2>
        <p className="text-base text-muted-foreground mb-8">
          Você acertou <strong className="text-foreground">{score}</strong> de {questions.length}{' '}
          perguntas ({percentage}%).
        </p>
        <Button
          onClick={() => {
            setCurrentIndex(0)
            setScore(0)
            setFinished(false)
            setShowFeedback(false)
            setSelectedOption('')
          }}
          className="min-h-[52px] px-8 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
        >
          <RotateCcw className="w-5 h-5 mr-2" /> Tentar Novamente
        </Button>
      </div>
    )
  }

  const q = questions[currentIndex]

  return (
    <div className="bg-card text-card-foreground p-6 md:p-10 rounded-[28px] border border-border space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-4">{quiz.title}</h2>
        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
          <span className="shrink-0">
            Questão {currentIndex + 1} de {questions.length}
          </span>
          <Progress value={(currentIndex / questions.length) * 100} className="flex-1 bg-muted" />
        </div>
      </div>

      <div className="text-lg md:text-xl text-foreground font-serif font-semibold leading-relaxed">
        {q.question}
      </div>

      <RadioGroup
        value={selectedOption}
        onValueChange={setSelectedOption}
        disabled={showFeedback}
        className="space-y-3"
      >
        {q.options.map((opt, i) => {
          const isThisCorrect = i.toString() === q.correct_option
          const isSelected = selectedOption === i.toString()
          let itemClass =
            'flex items-center space-x-4 min-h-[52px] p-4 md:p-5 rounded-[18px] border border-border bg-card transition-all cursor-pointer'

          if (showFeedback) {
            itemClass += ' cursor-default'
            if (isThisCorrect) {
              itemClass +=
                ' border-[#1F6B4A] bg-[#E3F1E9] text-[#1F6B4A] dark:bg-[#1F6B4A]/20 dark:border-[#1F6B4A] dark:text-[#E3F1E9] font-semibold'
            } else if (isSelected && !isThisCorrect) {
              itemClass +=
                ' border-[#B4472E] bg-[#FAE7E1] text-[#B4472E] dark:bg-[#B4472E]/20 dark:border-[#B4472E] dark:text-[#FAE7E1]'
            } else {
              itemClass += ' opacity-55'
            }
          } else {
            itemClass += ' hover:bg-muted/60 hover:border-foreground/30'
            if (isSelected) {
              itemClass += ' border-primary bg-primary/10 ring-2 ring-primary/40'
            }
          }

          return (
            <Label key={i} className={itemClass}>
              <RadioGroupItem
                value={i.toString()}
                className={showFeedback ? 'border-current text-current' : ''}
              />
              <span className="flex-1 text-sm md:text-base leading-relaxed">{opt}</span>
              {showFeedback && isThisCorrect && (
                <CheckCircle2 className="w-5 h-5 text-[#1F6B4A] dark:text-[#E3F1E9] shrink-0" />
              )}
              {showFeedback && isSelected && !isThisCorrect && (
                <XCircle className="w-5 h-5 text-[#B4472E] dark:text-[#FAE7E1] shrink-0" />
              )}
            </Label>
          )
        })}
      </RadioGroup>

      <div className="pt-6 border-t border-border flex justify-end">
        {!showFeedback ? (
          <Button
            onClick={() => {
              setShowFeedback(true)
              if (selectedOption === q.correct_option) setScore((s) => s + 1)
            }}
            disabled={!selectedOption}
            className="min-h-[52px] px-8 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm md:text-base"
          >
            Confirmar Resposta
          </Button>
        ) : (
          <Button
            onClick={() => {
              if (currentIndex < questions.length - 1) {
                setCurrentIndex((i) => i + 1)
                setSelectedOption('')
                setShowFeedback(false)
              } else {
                setFinished(true)
              }
            }}
            className="min-h-[52px] px-8 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm md:text-base"
          >
            {currentIndex < questions.length - 1 ? 'Próxima Questão' : 'Ver Resultado Final'}
          </Button>
        )}
      </div>
    </div>
  )
}
