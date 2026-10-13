import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { SquareLogo } from '@/components/ui/Logos'

const SUPPORT_WHATSAPP_NUMBER = '5511999999999'
const SUPPORT_WHATSAPP_MESSAGE = encodeURIComponent(
  'Olá! Tive um problema inesperado na página de cadastro da Plataforma Educação SST e preciso de ajuda.',
)

interface RegisterErrorBoundaryProps {
  children: React.ReactNode
}

interface RegisterErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class RegisterErrorBoundary extends React.Component<
  RegisterErrorBoundaryProps,
  RegisterErrorBoundaryState
> {
  constructor(props: RegisterErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): RegisterErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erro não tratado na página de cadastro:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${SUPPORT_WHATSAPP_MESSAGE}`

      return (
        <div className="min-h-[calc(100vh-80px)] bg-[#FAF8F3] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md bg-white rounded-[28px] border border-[#E4DED1] shadow-[0_16px_36px_rgba(28,27,24,0.06)] p-6 sm:p-8 text-center space-y-6">
            <div className="flex flex-col items-center">
              <SquareLogo variant="yellow" className="w-14 h-14 mb-3" />
              <div className="w-12 h-12 rounded-full bg-[#FAF4ED] border border-[#E8D9C5] flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-[#B4472E]" />
              </div>
              <h1 className="font-serif text-2xl font-semibold text-[#1C1B18]">
                Algo não saiu como esperado
              </h1>
              <p className="text-sm text-[#5F5A4F] mt-2">
                Ocorreu um erro inesperado ao carregar o formulário de cadastro. Seus dados já
                digitados estão salvos.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={this.handleReset}
                className="w-full h-11 rounded-full text-sm font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Tentar de novo
              </Button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-full text-sm font-semibold border border-[#E4DED1] bg-white hover:bg-[#FAF8F3] text-[#1C1B18] transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4 fill-current text-[#25D366]"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                Falar com o suporte no WhatsApp
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
