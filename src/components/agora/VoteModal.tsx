import { useState } from 'react'
import { AgoraPosicao } from '@/types'
import { CheckCircle2, XCircle, PlusCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { createVoto } from '@/services/agora'

interface VoteModalProps {
  open: boolean
  onClose: () => void
  debateId: string
  userId: string
  initialPosicao?: AgoraPosicao
  onVoteSuccess: () => void
}

const POSICOES_INFO = [
  {
    value: 'a_favor' as AgoraPosicao,
    label: 'A Favor',
    desc: 'Concordo com a tese ou diretriz proposta',
    icon: CheckCircle2,
    activeBorder: 'border-emerald-500 bg-emerald-50/70 text-emerald-900',
    hoverBorder: 'hover:border-emerald-300',
  },
  {
    value: 'contra' as AgoraPosicao,
    label: 'Contra',
    desc: 'Discordo tecnicamente dos pontos apresentados',
    icon: XCircle,
    activeBorder: 'border-rose-500 bg-rose-50/70 text-rose-900',
    hoverBorder: 'hover:border-rose-300',
  },
  {
    value: 'complementacao' as AgoraPosicao,
    label: 'Complementação',
    desc: 'Apresento nuances, exceções ou alternativas técnicas',
    icon: PlusCircle,
    activeBorder: 'border-sky-500 bg-sky-50/70 text-sky-900',
    hoverBorder: 'hover:border-sky-300',
  },
]

export function VoteModal({
  open,
  onClose,
  debateId,
  userId,
  initialPosicao,
  onVoteSuccess,
}: VoteModalProps) {
  const [posicao, setPosicao] = useState<AgoraPosicao | null>(initialPosicao || null)
  const [justificativa, setJustificativa] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  const charCount = justificativa.trim().length
  const isValidLength = charCount >= 50

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!posicao) {
      toast({
        title: 'Selecione uma posição',
        description: 'Escolha entre A Favor, Contra ou Complementação.',
        variant: 'destructive',
      })
      return
    }

    if (!isValidLength) {
      toast({
        title: 'Justificativa muito curta',
        description: 'Sua justificativa técnica deve conter pelo menos 50 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      await createVoto({
        debate_id: debateId,
        usuario_id: userId,
        posicao,
        justificativa: justificativa.trim(),
      })

      toast({
        title: 'Voto registrado com sucesso!',
        description: 'Seu argumento foi publicado na sala do debate.',
      })

      onVoteSuccess()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar voto',
        description: err?.data?.message || err?.message || 'Você já pode ter votado neste debate.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-xl bg-[#FAF8F3] border-[#C17A4E]/25 text-slate-900">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl md:text-2xl text-slate-900 flex items-center gap-2">
            <span>🏛️</span> Registrar seu Voto e Argumento
          </DialogTitle>
          <DialogDescription className="text-slate-600 text-xs md:text-sm">
            Na Ágora, todo voto é identificado e requer fundamentação técnica. Após confirmar, o
            voto é definitivo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Seleção de Posição */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Escolha sua posição <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {POSICOES_INFO.map((item) => {
                const isSelected = posicao === item.value
                return (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => setPosicao(item.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${item.activeBorder} shadow-sm ring-2 ring-offset-1`
                        : `bg-white border-slate-200 text-slate-700 ${item.hoverBorder}`
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm mb-1">
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Textarea de Justificativa */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Justificativa técnica <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-xs font-mono font-bold ${
                  isValidLength ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {charCount}/50 caracteres mín.
              </span>
            </div>

            <Textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Apresente sua fundamentação com base nas normas regulamentadoras, literatura técnica, dados práticos e vivência de campo..."
              className="min-h-[140px] bg-white border-slate-300 focus:border-[#C17A4E] focus:ring-[#C17A4E] text-slate-800 text-sm leading-relaxed"
              required
            />

            {!isValidLength && charCount > 0 && (
              <p className="text-xs text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Faltam {50 - charCount} caracteres para atingir o mínimo obrigatório.
              </p>
            )}
          </div>

          {/* Aviso de irrevogabilidade */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Atenção:</strong> Votos e argumentos não podem ser alterados ou apagados após
              a confirmação para garantir a integridade do histórico do debate.
            </span>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="border-slate-300 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || !posicao || !isValidLength}
              className="bg-[#C17A4E] hover:bg-[#a9663d] text-white font-bold"
            >
              {submitting ? 'Registrando...' : 'Confirmar e Publicar Voto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
