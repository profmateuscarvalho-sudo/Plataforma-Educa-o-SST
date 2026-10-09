import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { cadastrarListaEspera } from '@/services/lista_espera'

export interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
  plano: string
  title?: string
  description?: string
  successMessage?: string
}

export function WaitlistModal({
  isOpen,
  onClose,
  plano,
  title,
  description,
  successMessage,
}: WaitlistModalProps) {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Atualiza com dados do usuário quando abre
  React.useEffect(() => {
    if (isOpen) {
      setName(user?.name || '')
      setEmail(user?.email || '')
      setSuccess(false)
      setError(null)
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    setLoading(true)
    setError(null)
    try {
      await cadastrarListaEspera({
        nome: name,
        email,
        plano,
      })
      setSuccess(true)
    } catch (err: any) {
      console.error('Erro na lista de espera:', err)
      setError('Não foi possível registrar seu interesse agora. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-[28px] p-6 sm:p-8 shadow-2xl border border-[#E4DED1] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-2 rounded-full text-[#7F7869] hover:bg-[#FAF8F3] hover:text-[#1C1B18] transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-6 animate-fade-in space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#E3F1E9] flex items-center justify-center text-[#1F6B4A]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#1C1B18]">Interesse registrado!</h3>
            <p className="text-sm text-[#5F5A4F] leading-relaxed">
              {successMessage || (
                <>
                  Obrigado, <strong>{name}</strong>. Vamos te avisar em primeira mão por e-mail
                  assim que as novidades forem liberadas.
                </>
              )}
            </p>
            <div className="pt-2">
              <Button
                className="rounded-full px-6 bg-[#1C1B18] text-[#FAF8F3] hover:bg-[#1C1B18]/90 font-bold"
                onClick={onClose}
              >
                Entendido
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <span className="label-overline">LISTA DE ESPERA</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B18] mt-1 mb-2">
              {title || 'Avise-me quando abrir'}
            </h3>
            <p className="text-sm text-[#5F5A4F] mb-6">
              {description ||
                'Preencha seus dados para receber o aviso em primeira mão assim que abrirmos novas vagas.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1B18] mb-1.5">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full h-11 px-4 rounded-xl border border-[#E4DED1] bg-[#FAF8F3] text-sm text-[#1C1B18] focus:outline-none focus:border-[#1C1B18]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1B18] mb-1.5">
                  E-mail profissional
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com"
                  className="w-full h-11 px-4 rounded-xl border border-[#E4DED1] bg-[#FAF8F3] text-sm text-[#1C1B18] focus:outline-none focus:border-[#1C1B18]"
                />
              </div>

              {error && <p className="text-xs text-[#B4472E] font-medium">{error}</p>}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Quero ser avisado
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
