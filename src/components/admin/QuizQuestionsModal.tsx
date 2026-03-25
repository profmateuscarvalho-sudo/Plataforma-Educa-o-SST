import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Quiz, QuizQuestion } from '@/types'
import { getQuizQuestions, createQuizQuestion, deleteQuizQuestion } from '@/services/curriculum'
import { Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Props {
  quiz: Quiz | null
  onClose: () => void
}

export function QuizQuestionsModal({ quiz, onClose }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    if (quiz) {
      try {
        const data = await getQuizQuestions(quiz.id)
        setQuestions(data)
      } catch (err) {
        console.error(err)
      }
    }
  }

  useEffect(() => {
    if (quiz) {
      load()
      setIsAdding(false)
    }
  }, [quiz])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!quiz) return
    const fd = new FormData(e.currentTarget)
    const question = fd.get('question') as string
    const options = [
      fd.get('opt_0') as string,
      fd.get('opt_1') as string,
      fd.get('opt_2') as string,
      fd.get('opt_3') as string,
    ]
    const correct_option = fd.get('correct_option') as string

    try {
      await createQuizQuestion({
        quiz: quiz.id,
        question,
        options,
        correct_option,
      })
      toast({ title: 'Pergunta adicionada com sucesso' })
      setIsAdding(false)
      load()
    } catch {
      toast({ title: 'Erro ao adicionar pergunta', variant: 'destructive' })
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Deseja excluir esta pergunta?')) return
    try {
      await deleteQuizQuestion(id)
      load()
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!quiz} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Perguntas: {quiz?.title}</DialogTitle>
        </DialogHeader>

        {!isAdding ? (
          <div className="space-y-6 pt-2">
            <div className="flex justify-end">
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4 mr-2" /> Nova Pergunta
              </Button>
            </div>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-5 border rounded-xl bg-slate-50 relative pr-12">
                  <p className="font-semibold text-slate-800 mb-3">
                    {idx + 1}. {q.question}
                  </p>
                  <ul className="text-sm space-y-2 text-slate-600">
                    {q.options.map((opt, i) => {
                      const isCorrect = i.toString() === q.correct_option
                      return (
                        <li
                          key={i}
                          className={`flex items-start gap-2 ${
                            isCorrect ? 'font-bold text-emerald-600' : ''
                          }`}
                        >
                          <span className="shrink-0">{String.fromCharCode(65 + i)})</span>
                          <span>{opt}</span>
                          {isCorrect && '✓'}
                        </li>
                      )
                    })}
                  </ul>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 text-red-500 hover:bg-red-100"
                    onClick={() => remove(q.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-center text-slate-500 py-12 bg-slate-50 rounded-xl border border-dashed">
                  Nenhuma pergunta cadastrada. Clique em "Nova Pergunta" para começar.
                </p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div>
              <Label>Texto da Pergunta *</Label>
              <Textarea name="question" required className="mt-1 h-24" />
            </div>
            <div className="space-y-4">
              <Label>Opções e Resposta Correta *</Label>
              <p className="text-xs text-slate-500 mb-2">
                Preencha as opções e selecione a correta.
              </p>
              <RadioGroup defaultValue="0" name="correct_option" className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 focus-within:ring-2 focus-within:ring-primary/20"
                  >
                    <RadioGroupItem value={i.toString()} id={`opt_${i}`} />
                    <span className="font-medium text-sm text-slate-500 w-4">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <Input
                      name={`opt_${i}`}
                      required
                      placeholder={`Digite a opção ${String.fromCharCode(65 + i)}`}
                      className="flex-1 bg-white"
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Pergunta</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
