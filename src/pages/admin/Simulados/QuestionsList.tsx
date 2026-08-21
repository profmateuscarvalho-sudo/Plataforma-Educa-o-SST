import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  getSimuladoQuestions,
  createSimuladoQuestion,
  updateSimuladoQuestion,
  deleteSimuladoQuestion,
} from '@/services/simulados'
import { toast } from 'sonner'
import type { SimuladoQuestion } from '@/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function QuestionsList({ simuladoId }: { simuladoId: string }) {
  const [questions, setQuestions] = useState<SimuladoQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Partial<SimuladoQuestion>>({
    options: ['', '', '', ''],
    comment: '',
  })

  const loadData = async () => {
    try {
      const data = await getSimuladoQuestions(simuladoId)
      setQuestions(data)
    } catch (error) {
      toast.error('Erro ao carregar questões')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [simuladoId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current.question || !current.correct_option)
      return toast.error('Preencha a pergunta e selecione a correta')
    if (current.options?.some((o) => !o)) return toast.error('Preencha todas as opções')

    try {
      if (current.id) {
        await updateSimuladoQuestion(current.id, current)
        toast.success('Questão atualizada')
      } else {
        await createSimuladoQuestion({ ...current, simulado: simuladoId })
        toast.success('Questão criada')
      }
      setOpen(false)
      loadData()
    } catch (error) {
      toast.error('Erro ao salvar questão')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja remover esta questão?')) return
    try {
      await deleteSimuladoQuestion(id)
      toast.success('Questão removida')
      loadData()
    } catch (error) {
      toast.error('Erro ao remover')
    }
  }

  const updateOption = (idx: number, value: string) => {
    const newOptions = [...(current.options || [])]
    newOptions[idx] = value
    setCurrent({ ...current, options: newOptions })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Questões do Simulado</h3>
        <Button
          onClick={() => {
            setCurrent({ options: ['', '', '', ''], correct_option: '', comment: '' })
            setOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar Questão
        </Button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : questions.length === 0 ? (
        <div className="text-center p-8 bg-slate-50 rounded-lg text-slate-500 border border-dashed">
          Nenhuma questão cadastrada.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="p-4 border rounded-lg bg-white shadow-sm flex gap-4 justify-between items-start"
            >
              <div>
                <p className="font-semibold mb-2">
                  {i + 1}. {q.question}
                </p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {q.options.map((opt, idx) => (
                    <li
                      key={idx}
                      className={opt === q.correct_option ? 'text-green-600 font-medium' : ''}
                    >
                      {String.fromCharCode(65 + idx)}) {opt}
                    </li>
                  ))}
                </ul>
                {q.comment && (
                  <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="font-semibold text-slate-700">Comentário:</span> {q.comment}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCurrent(q)
                    setOpen(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{current.id ? 'Editar Questão' : 'Nova Questão'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Input
                value={current.question || ''}
                onChange={(e) => setCurrent({ ...current, question: e.target.value })}
                required
              />
            </div>
            <div className="space-y-4">
              <Label>Opções (Selecione a correta)</Label>
              <RadioGroup
                value={current.correct_option || ''}
                onValueChange={(val) => setCurrent({ ...current, correct_option: val })}
              >
                {[0, 1, 2, 3].map((idx) => {
                  const optValue = current.options?.[idx] || ''
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <RadioGroupItem value={optValue} disabled={!optValue} id={`opt-${idx}`} />
                      <Input
                        value={optValue}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        placeholder={`Opção ${String.fromCharCode(65 + idx)}`}
                        required
                      />
                    </div>
                  )
                })}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-comment">Comentário (opcional)</Label>
              <Textarea
                id="question-comment"
                placeholder="Escreva uma explicação ou comentário sobre a resposta correta..."
                rows={3}
                value={current.comment || ''}
                onChange={(e) => setCurrent({ ...current, comment: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
