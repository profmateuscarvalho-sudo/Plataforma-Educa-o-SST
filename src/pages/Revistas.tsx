import { MAGAZINES } from '@/lib/data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Download, BookOpen } from 'lucide-react'

export default function Revistas() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <section className="bg-secondary text-white py-20">
        <div className="container px-4 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-accent">
            Acervo Científico
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed font-light">
            Acesso público e gratuito às nossas publicações periódicas com artigos focados no avanço
            da Segurança e Saúde no Trabalho.
          </p>
        </div>
      </section>

      <section className="container px-4 pt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {MAGAZINES.map((mag) => (
            <Card
              key={mag.id}
              className="group overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-300 bg-white"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                <img
                  src={mag.image}
                  alt={mag.issue}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-accent text-secondary hover:bg-accent/90 translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-bold">
                        <BookOpen className="w-4 h-4 mr-2" /> Ler Edição Completa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-secondary">
                          {mag.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col md:flex-row gap-6 mt-4">
                        <img
                          src={mag.image}
                          alt="Capa"
                          className="w-40 rounded-lg shadow-md object-cover"
                        />
                        <div className="space-y-4 flex-1">
                          <p className="text-sm font-bold text-primary bg-primary/10 w-fit px-2 py-1 rounded">
                            {mag.issue}
                          </p>
                          <p className="text-slate-600 text-sm leading-relaxed">{mag.summary}</p>
                          <Button
                            className="w-full mt-4 h-12"
                            onClick={() => window.open(mag.pdfUrl, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" /> Baixar PDF Completo
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <CardContent className="p-5">
                <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  {mag.date}
                </p>
                <h3 className="font-serif font-bold text-lg text-secondary line-clamp-2 leading-tight group-hover:text-primary transition-colors">
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
