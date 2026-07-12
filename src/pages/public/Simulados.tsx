import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, ChevronRight, Share2, LayoutDashboard } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSimulados } from '@/services/simulados'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
import type { Simulado } from '@/types'
import { useAuth } from '@/hooks/use-auth'

export default function PublicSimulados() {
  const { user } = useAuth()
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSimulados(true)
      .then(setSimulados)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="mb-4 bg-white/20 hover:bg-white/30 text-white border-none"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Teste seus conhecimentos
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Simulados SST</h1>
            <p className="text-lg text-primary-foreground/90">
              Acesse simulados interativos criados por especialistas. Pratique para concursos,
              certificações e aprimore sua base teórica.
            </p>
            {user && (
              <Link
                to="/plataforma"
                className="inline-flex items-center gap-2 mt-4 px-4 h-10 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-medium backdrop-blur transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Voltar ao Hub
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-slate-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : simulados.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-2xl font-bold text-slate-700">Nenhum simulado disponível</h3>
            <p className="text-slate-500 mt-2">Volte em breve para novos desafios.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {simulados.map((simulado) => (
              <Card
                key={simulado.id}
                className="overflow-hidden hover:shadow-lg transition-all group flex flex-col"
              >
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  <img
                    src={pb.files.getURL(simulado, simulado.banner)}
                    alt={simulado.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-accent text-secondary hover:bg-accent/90">
                      Simulado Interativo
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <h3 className="text-xl font-bold line-clamp-2">{simulado.title}</h3>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-slate-600 text-sm line-clamp-3">{simulado.description}</p>
                </CardContent>
                <CardFooter className="pt-4 border-t flex gap-2">
                  <Button className="w-full group flex-1" asChild>
                    <Link to={`/simulados/${simulado.id}`}>
                      Iniciar Simulado{' '}
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title="Compartilhar no WhatsApp"
                    onClick={() => {
                      const shareUrl = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/share/simulados/${simulado.id}`
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(simulado.title + ' ' + shareUrl)}`,
                        '_blank',
                      )
                    }}
                  >
                    <Share2 className="w-4 h-4 text-slate-500 hover:text-slate-900" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
