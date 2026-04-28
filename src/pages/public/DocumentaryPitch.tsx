import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { DocProject, DocProjectCost, DocProjectTeam } from '@/types'
import { getDocProjectBySlug, getDocProjectCosts, getDocProjectTeam } from '@/services/doc_projects'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, DollarSign, Camera, ChevronRight, Mail } from 'lucide-react'

export default function DocumentaryPitch() {
  const { slug } = useParams()
  const [project, setProject] = useState<DocProject | null>(null)
  const [costs, setCosts] = useState<DocProjectCost[]>([])
  const [team, setTeam] = useState<DocProjectTeam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    const load = async () => {
      try {
        const p = await getDocProjectBySlug(slug)
        setProject(p)
        const [c, t] = await Promise.all([getDocProjectCosts(p.id), getDocProjectTeam(p.id)])
        setCosts(c)
        setTeam(t)
      } catch (e) {
        console.error('Project pitch not found:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500 animate-pulse font-medium tracking-widest uppercase">
        Carregando Experiência...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white flex-col gap-6">
        <h1 className="text-3xl font-light">Projeto não encontrado ou indisponível</h1>
        <Button
          variant="outline"
          className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-zinc-950"
          asChild
        >
          <Link to="/">Voltar à Plataforma</Link>
        </Button>
      </div>
    )
  }

  const calculatedBudget =
    project.total_budget || costs.reduce((acc, c) => acc + c.estimated_value, 0)
  const heroImage = project.presentation_photos?.[0]
    ? pb.files.getUrl(project, project.presentation_photos[0])
    : 'https://img.usecurling.com/p/1920/1080?q=cinematic,documentary&color=black'
  const responsibleEmail = project.expand?.responsible?.email || 'contato@educacaosst.com.br'

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500/30">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt={project.title}
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        </div>
        <div className="relative z-10 container max-w-5xl mx-auto px-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Badge className="bg-amber-500 text-black hover:bg-amber-400 mb-8 uppercase tracking-[0.2em] px-4 py-1.5 text-xs font-bold border-0 shadow-lg shadow-amber-500/20">
            Apresentação para Investidores
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 text-white drop-shadow-xl">
            {project.title}
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-12 font-light">
            {project.description ||
              'Um projeto audiovisual de alto impacto voltado para o mercado de SST.'}
          </p>
          <Button
            size="lg"
            className="bg-amber-500 text-black hover:bg-amber-400 text-lg px-8 py-7 rounded-full font-bold uppercase tracking-wide transition-all hover:scale-105"
            onClick={() =>
              document.getElementById('investment')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Seja um Patrocinador <ChevronRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </section>

      {/* Methodology Section */}
      {project.methodology && (
        <section className="py-24 bg-zinc-900 border-t border-zinc-800/50">
          <div className="container max-w-4xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-12">
              <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <Camera className="h-8 w-8" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight">Nossa Metodologia</h2>
            </div>
            <div
              className="prose prose-invert prose-lg max-w-none text-zinc-300 prose-headings:text-white prose-a:text-amber-500 hover:prose-a:text-amber-400 prose-strong:text-white"
              dangerouslySetInnerHTML={{ __html: project.methodology.replace(/\n/g, '<br/>') }}
            />
          </div>
        </section>
      )}

      {/* Impact Gallery Section */}
      {project.presentation_photos && project.presentation_photos.length > 1 && (
        <section className="py-24 bg-zinc-950">
          <div className="container max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-16 text-center tracking-tight">
              Visão do Projeto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.presentation_photos.map((photo, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 group relative"
                >
                  <div className="absolute inset-0 bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 mix-blend-overlay" />
                  <img
                    src={pb.files.getUrl(project, photo)}
                    alt={`Cena do documentário ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team / Featured Guests Section */}
      {team.length > 0 && (
        <section className="py-24 bg-zinc-900 border-y border-zinc-800/50">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-16 justify-center">
              <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <Users className="h-8 w-8" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight">Equipe & Participações</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {team.map((member) => (
                <div key={member.id} className="text-center group">
                  <div className="w-32 h-32 mx-auto rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center overflow-hidden mb-6 group-hover:border-amber-500 transition-colors shadow-xl">
                    <Users className="h-10 w-10 text-zinc-700 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <h3 className="font-bold text-xl text-zinc-100 mb-1">{member.name}</h3>
                  <p className="text-amber-500 font-medium tracking-wide uppercase text-xs">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Investment Section */}
      <section id="investment" className="py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 shadow-lg mb-6">
              <DollarSign className="h-5 w-5 text-amber-500" />
              <span className="font-semibold tracking-widest uppercase text-sm">
                Plano de Investimento
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-stretch">
            {/* Costs Breakdown */}
            <div className="lg:col-span-3 bg-zinc-900/80 p-10 rounded-3xl border border-zinc-800 backdrop-blur-xl shadow-2xl">
              <h3 className="text-zinc-400 font-medium mb-3 uppercase tracking-widest text-sm">
                Orçamento Total Estimado
              </h3>
              <p className="text-5xl font-black text-white mb-10 tracking-tight">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  calculatedBudget,
                )}
              </p>

              <div className="space-y-4">
                {costs.length > 0 ? (
                  costs.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center text-base p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50"
                    >
                      <span className="text-zinc-300 font-medium">{c.category}</span>
                      <span className="text-zinc-100 font-bold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(c.estimated_value)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 text-sm italic">
                    O orçamento detalhado está em elaboração.
                  </p>
                )}
              </div>
            </div>

            {/* Quota CTA */}
            <div className="lg:col-span-2 bg-gradient-to-br from-amber-500 to-amber-600 p-10 rounded-3xl border border-amber-400 text-zinc-950 flex flex-col justify-center relative overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.2)]">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 blur-2xl rounded-full pointer-events-none" />

              <h3 className="font-bold mb-3 text-amber-950 tracking-wide uppercase text-sm">
                Cota de Patrocínio (Por Empresa)
              </h3>
              <p className="text-5xl font-black mb-6 tracking-tight drop-shadow-sm">
                {project.investment_quota
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      project.investment_quota,
                    )
                  : 'A Combinar'}
              </p>

              <p className="text-amber-950/90 font-medium mb-10 leading-relaxed">
                Associe sua marca a este projeto inovador e ganhe destaque em exibições, créditos e
                materiais de ampla distribuição.
              </p>

              <Button
                size="lg"
                className="bg-zinc-950 text-amber-500 hover:bg-zinc-800 rounded-2xl w-full h-16 text-lg font-bold shadow-xl transition-transform hover:scale-[1.02]"
                asChild
              >
                <a
                  href={`mailto:${responsibleEmail}?subject=Interesse em Patrocínio: ${project.title}`}
                >
                  <Mail className="mr-3 h-6 w-6" /> Falar com a Produção
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 bg-zinc-950 text-center text-zinc-600 text-sm">
        <p className="uppercase tracking-widest font-medium mb-2">Plataforma Educação SST</p>
        <p>© {new Date().getFullYear()} Todos os direitos reservados à produção.</p>
      </footer>
    </div>
  )
}
