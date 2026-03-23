import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import { getMagazines } from '@/services/magazines'
import { Magazine } from '@/types'
import pb from '@/lib/pocketbase/client'

export default function Revistas() {
  const [magazines, setMagazines] = useState<Magazine[]>([])

  useEffect(() => {
    getMagazines().then(setMagazines).catch(console.error)
  }, [])

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
          {magazines.map((mag) => {
            const imgUrl = mag.thumbnail
              ? pb.files.getUrl(mag, mag.thumbnail)
              : 'https://img.usecurling.com/p/400/600?q=magazine&color=green'
            return (
              <Card
                key={mag.id}
                className="group overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-300 bg-white"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                  <img
                    src={imgUrl}
                    alt={mag.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                    <Button
                      className="w-full bg-accent text-secondary hover:bg-accent/90 translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-bold"
                      onClick={() => window.open(mag.fliphtml5_link || '#', '_blank')}
                    >
                      <BookOpen className="w-4 h-4 mr-2" /> Ler na FlipHTML5
                    </Button>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-serif font-bold text-lg text-secondary line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {mag.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">{mag.summary}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
