import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BookOpen, Send, Search, CheckCircle } from 'lucide-react'

export default function SubmitArticleInfo() {
  const [token, setToken] = useState('')
  const navigate = useNavigate()

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (token.trim()) {
      navigate(`/submissao-artigo/${token.trim()}`)
    }
  }

  const whatsappNumber = '5518997190486'
  const whatsappMessage = encodeURIComponent(
    'Olá! Gostaria de saber mais sobre como publicar um artigo na Revista Educação SST e solicitar um token de submissão.',
  )
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-slate-50 py-12 md:py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            <BookOpen className="w-4 h-4" /> Chamada para Autores
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-6">
            Publique seu Artigo na <br className="hidden md:block" />
            <span className="text-primary">Revista Educação SST</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Compartilhe seu conhecimento, expanda sua autoridade e conecte-se com milhares de
            profissionais de Segurança e Saúde no Trabalho.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Como Funciona o Processo?</h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Solicite um Token</h3>
                    <p className="text-slate-600 mt-1">
                      Entre em contato com nossa equipe editorial para apresentar sua proposta de
                      tema. Sendo aprovado, você receberá um token único.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Prepare seu Material</h3>
                    <p className="text-slate-600 mt-1">
                      Escreva seu artigo (2.000 a 5.000 palavras), seguindo normas técnicas e de
                      formatação, e separe uma foto profissional para seu perfil.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-600 font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Envie na Plataforma</h3>
                    <p className="text-slate-600 mt-1">
                      Utilize seu token no formulário ao lado para submeter o texto, imagens e
                      concordar com os termos de publicação.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" /> Não tem um token ainda?
              </h3>
              <p className="text-slate-600 mb-6 text-sm">
                Fale com a nossa equipe pelo WhatsApp para avaliar o escopo do seu artigo e gerar o
                seu acesso exclusivo.
              </p>
              <Button asChild className="w-full" variant="outline">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  Solicitar Token por WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div className="sticky top-28">
            <Card className="border-t-4 border-t-primary shadow-xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Já possui um Token?</CardTitle>
                <CardDescription className="text-base mt-2">
                  Insira o código recebido para acessar o formulário de submissão do seu artigo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Ex: abc123def456"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="h-14 text-center text-lg tracking-widest font-mono bg-slate-50"
                      required
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold">
                    <Send className="w-5 h-5 mr-2" /> Acessar Formulário
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
