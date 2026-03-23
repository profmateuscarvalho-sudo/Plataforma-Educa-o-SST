import { MAGAZINES } from '@/lib/data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Download, BookOpen, Lock } from 'lucide-react'

export default function Revistas() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <section className="bg-white py-20 border-b border-slate-200">
        <div className="container px-4 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">
            Acervo Científico
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Publicações periódicas exclusivas com artigos, pesquisas e estudos de caso focados no
            avanço da Segurança e Saúde no Trabalho.
          </p>
        </div>
      </section>

      {/* Archive Grid */}
      <section className="container px-4 pt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {MAGAZINES.map((mag) => (
            <Card
              key={mag.id}
              className="group overflow-hidden border-none shadow-md hover:shadow-premium transition-all duration-300 bg-white"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                <img
                  src={mag.image}
                  alt={mag.issue}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        className="translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                      >
                        <BookOpen className="w-4 h-4 mr-2" /> Visualizar Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-primary mb-2">
                          {mag.title}
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-600">
                          {mag.issue} • {mag.date}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-6 mt-6">
                        <div className="w-1/3 shrink-0">
                          <img src={mag.image} alt="Capa" className="w-full rounded-md shadow-md" />
                        </div>
                        <div className="w-2/3 space-y-6">
                          <div>
                            <h4 className="font-bold text-slate-800 mb-2">Resumo da Edição</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{mag.summary}</p>
                          </div>
                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <Button className="w-full" variant="default">
                              <Lock className="w-4 h-4 mr-2" /> Acesso Área do Aluno
                            </Button>
                            <Button className="w-full" variant="outline">
                              <Download className="w-4 h-4 mr-2" /> Baixar Amostra Grátis (PDF)
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <CardContent className="p-5">
                <p className="text-xs font-bold text-accent mb-2 uppercase tracking-wider">
                  {mag.date}
                </p>
                <h3 className="font-serif font-bold text-lg text-slate-800 line-clamp-2 leading-tight">
                  {mag.issue}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
