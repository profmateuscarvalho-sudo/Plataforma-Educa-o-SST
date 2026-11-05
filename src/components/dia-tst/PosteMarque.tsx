import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { INSTAGRAM_REVISTA } from '@/lib/dia-tst'

const PASSOS = [
  'Publique a imagem nos seus stories do Instagram até 27/11, às 23h59.',
  'Marque a Revista no story (seu perfil precisa estar público no dia).',
  'Pronto: sua frase entra na avaliação da comissão julgadora.',
]

export default function PosteMarque() {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(INSTAGRAM_REVISTA)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // fallback silencioso
    }
  }

  return (
    <div className="space-y-5">
      <ol className="space-y-3">
        {PASSOS.map((p, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-verde-escuro text-sm font-bold text-white">
              {i + 1}
            </span>
            <p className="text-sm sm:text-base leading-relaxed text-ink/85 pt-1">{p}</p>
          </li>
        ))}
      </ol>

      <div className="rounded-xl border-2 border-dashed border-laranja/50 bg-laranja/[0.06] p-5 text-center">
        <p className="text-xs uppercase tracking-widest text-ink/60 font-semibold">
          Marque a Revista no story
        </p>
        <p className="mt-1 text-2xl font-bold text-verde-escuro break-all">{INSTAGRAM_REVISTA}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copiar}
          className="mt-3 border-verde-escuro text-verde-escuro hover:bg-verde-escuro hover:text-white"
        >
          {copiado ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copiado ? '@ copiado!' : 'Copiar @'}
        </Button>
      </div>
    </div>
  )
}
