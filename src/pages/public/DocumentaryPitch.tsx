import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { DocProject, DocProjectCost, DocProjectTeam, DocProjectGuest } from '@/types'
import {
  getDocProjectBySlug,
  getDocProjectCosts,
  getDocProjectTeam,
  getDocProjectGuests,
} from '@/services/doc_projects'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  DollarSign,
  Camera,
  Calendar,
  UserRound,
  Target,
  ListChecks,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { Logo } from '@/components/ui/Logos'
import { ptBR } from 'date-fns/locale'

export default function DocumentaryPitch() {
  const { slug } = useParams()
  const [project, setProject] = useState<DocProject | null>(null)
  const [costs, setCosts] = useState<DocProjectCost[]>([])
  const [team, setTeam] = useState<DocProjectTeam[]>([])
  const [guests, setGuests] = useState<DocProjectGuest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    const load = async () => {
      try {
        const p = await getDocProjectBySlug(slug)
        setProject(p)
        const [c, t, g] = await Promise.all([
          getDocProjectCosts(p.id),
          getDocProjectTeam(p.id),
          getDocProjectGuests(p.id),
        ])
        setCosts(c)
        setTeam(t)
        setGuests(g)
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

  const heroImage = project.presentation_photos?.[0]
    ? pb.files.getUrl(project, project.presentation_photos[0])
    : 'https://img.usecurling.com/p/1920/1080?q=cinematic,documentary&color=black'

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500/30 pb-20">
      {/* Header Logo */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
        <Logo className="text-white drop-shadow-md" />
      </div>

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
          <Badge className="bg-amber-500 text-black mb-8 uppercase tracking-[0.2em] px-5 py-2 text-xs font-bold border-0 shadow-lg shadow-amber-500/20">
            Faça parte desse projeto
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 text-white drop-shadow-xl">
            {project.title}
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-12 font-light">
            {project.description ||
              'Um projeto audiovisual de alto impacto voltado para o mercado de SST.'}
          </p>

          {project.estimated_release_date && (
            <div className="inline-flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-zinc-800 text-amber-500 font-medium">
              <Calendar className="h-5 w-5" />
              Lançamento Estimado:{' '}
              {format(new Date(project.estimated_release_date), "MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          )}
        </div>
      </section>

      {/* Objectives & Topics Section */}
      {(project.objectives?.length > 0 || project.topics?.length > 0) && (
        <section className="py-24 bg-zinc-950 border-t border-zinc-800/50">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16">
              {project.objectives && project.objectives.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                      <Target className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Objetivos do Projeto</h2>
                  </div>
                  <ul className="space-y-4">
                    {project.objectives.map((obj, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50"
                      >
                        <CheckCircle2 className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-zinc-300 leading-relaxed">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {project.topics && project.topics.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                      <ListChecks className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Tópicos Abordados</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {project.topics.map((topic, i) => (
                      <div
                        key={i}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-5 py-3 rounded-full text-sm font-medium"
                      >
                        {topic}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Introduction Section (previously Methodology) */}
      {project.methodology && (
        <section className="py-24 bg-zinc-900 border-t border-zinc-800/50">
          <div className="container max-w-4xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-12">
              <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <FileText className="h-8 w-8" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight">Introdução</h2>
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

      {/* Guests / Participants Section */}
      {guests.length > 0 && (
        <section className="py-24 bg-zinc-900 border-y border-zinc-800/50">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="flex flex-col items-center mb-16 text-center">
              <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] mb-6">
                <UserRound className="h-8 w-8" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight mb-4">Participações Especiais</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Vozes de autoridade, especialistas e personagens que dão vida a este projeto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {guests.map((guest, i) => (
                <div
                  key={guest.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center hover:border-amber-500/50 transition-colors"
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-zinc-900 shadow-xl">
                    <img
                      src={
                        guest.photo
                          ? pb.files.getUrl(guest, guest.photo)
                          : `https://img.usecurling.com/ppl/medium?seed=${i + 10}`
                      }
                      alt={guest.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{guest.name}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{guest.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Technical Team Section */}
      {team.length > 0 && (
        <section className="py-24 bg-zinc-950">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="flex flex-col items-center mb-16 text-center">
              <div className="p-4 bg-zinc-900 rounded-2xl text-zinc-400 border border-zinc-800 mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Equipe Técnica</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-16">
              {team.map((member, i) => (
                <div key={member.id} className="text-center group">
                  <div className="w-24 h-24 mx-auto rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center overflow-hidden mb-5 group-hover:border-zinc-500 transition-colors grayscale group-hover:grayscale-0">
                    <img
                      src={
                        member.photo
                          ? pb.files.getUrl(member, member.photo)
                          : `https://img.usecurling.com/ppl/thumbnail?seed=${i + 50}`
                      }
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-lg text-zinc-200 mb-1">{member.name}</h3>
                  <p className="text-zinc-500 font-medium tracking-wide uppercase text-xs">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Investment Summary Section */}
      {project.investment_quota && (
        <section className="py-24 bg-zinc-900 border-t border-zinc-800/50">
          <div className="container max-w-3xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-zinc-950 border border-zinc-800 shadow-lg mb-8">
              <DollarSign className="h-5 w-5 text-amber-500" />
              <span className="font-semibold tracking-widest uppercase text-sm">
                Cota de Patrocínio
              </span>
            </div>

            <div className="bg-zinc-950 p-12 rounded-3xl border border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
              <h3 className="text-zinc-400 font-medium mb-4 uppercase tracking-widest text-sm">
                Valor do Investimento por Empresa
              </h3>
              <p className="text-5xl md:text-7xl font-black text-amber-500 tracking-tight mb-8">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  project.investment_quota,
                )}
              </p>
              <p className="text-zinc-300 leading-relaxed max-w-xl mx-auto mb-8">
                Garanta a visibilidade da sua marca neste projeto pioneiro e associe-se à inovação e
                excelência no mercado de SST.
              </p>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-lg px-8 py-6 rounded-xl w-full sm:w-auto"
                asChild
              >
                <a href="https://wa.me/5518997190486" target="_blank" rel="noopener noreferrer">
                  Tenho Interesse em Patrocinar
                </a>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
