import { useState } from 'react'
import { AgoraDebate } from '@/types'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { updateDebate } from '@/services/agora'
import { Sparkles, CheckCircle2, Lock } from 'lucide-react'

interface ModeratorPanelProps {
  debate: AgoraDebate
  onUpdateSuccess: () => void
}

export function ModeratorPanel({ debate, onUpdateSuccess }: ModeratorPanelProps) {
  const [conclusoes, setConclusoes] = useState<string>(debate.conclusoes || '')
  const [aprendizados, setAprendizados] = useState<string>(debate.aprendizados || '')
  const [saving, setSaving] = useState<boolean>(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDebate(debate.id, {
        conclusoes: conclusoes.trim(),
        aprendizados: aprendizados.trim(),
      })
      toast({
        title: 'Conclusões publicadas!',
        description: 'O sumário oficial do moderador foi registrado com sucesso.',
      })
      onUpdateSuccess()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar conclusões',
        description: err?.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#FAF8F3] via-[#F5EFE6] to-[#FAF8F3] border-2 border-[#C4A43A]/40 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-2.5 text-[#C4A43A] font-bold text-sm uppercase tracking-wider mb-2">
        <Sparkles className="w-4 h-4" />
        <span>Painel do Moderador · Síntese Técnica</span>
      </div>

      <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">
        Consolidar Conclusões e Aprendizados
      </h3>
      <p className="text-slate-600 text-sm mb-6 max-w-2xl leading-relaxed">
        Como moderador deste debate encerrado, registre a síntese dos principais pontos de
        convergência, divergência técnica e recomendações para a comunidade de SST.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            1. Conclusões gerais do debate
          </label>
          <Textarea
            value={conclusoes}
            onChange={(e) => setConclusoes(e.target.value)}
            placeholder="Resuma os posicionamentos mais relevantes, o consenso técnico alcançado ou as principais lacunas levantadas pelos participantes..."
            className="min-h-[120px] bg-white border-slate-300 focus:border-[#C17A4E] text-slate-800 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            2. Principais aprendizados e recomendações práticas
          </label>
          <Textarea
            value={aprendizados}
            onChange={(e) => setAprendizados(e.target.value)}
            placeholder="Liste diretrizes aplicáveis ao dia a dia dos profissionais: orientações normativas, boas práticas e cuidados na gestão de risco..."
            className="min-h-[120px] bg-white border-slate-300 focus:border-[#C17A4E] text-slate-800 text-sm"
          />
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#C17A4E] hover:bg-[#a9663d] text-white font-bold px-6 py-2.5 shadow-md flex items-center gap-2"
          >
            {saving ? (
              'Salvando...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Publicar Conclusões Oficiais
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
