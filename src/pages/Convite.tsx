import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  ArrowRight,
  BookOpen,
  Users,
  Newspaper,
  Video,
  NotebookPen,
  MessageSquare,
  Check,
} from 'lucide-react'
import { useEffect } from 'react'

const BENEFITS = [
  {
    icon: BookOpen,
    title: 'Cursos em SST',
    desc: 'Acesso a cursos selecionados em Segurança e Saúde no Trabalho',
  },
  {
    icon: Newspaper,
    title: 'Revista Digital',
    desc: 'Revista Educação SST científica disponível gratuitamente',
  },
  { icon: Video, title: 'Aulas ao Vivo', desc: 'Participe de aulas ao vivo toda quarta-feira' },
  {
    icon: NotebookPen,
    title: 'Caderno de Estudos',
    desc: 'Ferramenta digital para anotações e mapas mentais',
  },
  {
    icon: MessageSquare,
    title: 'Ágora de Debates',
    desc: 'Participe e vote em discussões técnicas e normativas reais',
  },
  { icon: Users, title: 'Comunidade', desc: 'Conecte-se com milhares de profissionais de SST' },
]

const TESTIMONIALS = [
  {
    name: 'Carlos Silva',
    role: 'Técnico em Segurança',
    text: 'A plataforma revolucionou meus estudos. O conteúdo é prático e direto.',
    seed: 'carlos1',
  },
  {
    name: 'Ana Oliveira',
    role: 'Enfermeira do Trabalho',
    text: 'Excelente para atualização profissional. As aulas ao vivo são incríveis!',
    seed: 'ana2',
  },
  {
    name: 'Pedro Santos',
    role: 'Engenheiro de Segurança',
    text: 'Melhor plataforma de SST que já utilizei. Recomendo a todos os colegas.',
    seed: 'pedro3',
  },
]

const STEPS = [
  { n: '1', title: 'Crie sua conta', desc: 'Cadastro rápido e gratuito, sem cartão de crédito' },
  { n: '2', title: 'Explore o conteúdo', desc: 'Acesse cursos, revistas, aulas ao vivo e mais' },
  {
    n: '3',
    title: 'Aprenda e conecte-se',
    desc: 'Estude no seu ritmo e conecte-se com profissionais',
  },
]

const PLAN_FEATURES = [
  'Hub do aluno',
  'Revista digital',
  'Cursos selecionados',
  'Aulas ao vivo',
  'Caderno de estudos',
  'Ágora de Debates',
]

export default function Convite() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && user && user.role === 'student') {
      navigate('/plataforma', { replace: true })
    }
  }, [user, authLoading, navigate])

  return (
    <div className="flex flex-col">
      <section className="min-h-[80vh] flex items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20 pb-12">
        <div className="container px-4 max-w-4xl mx-auto text-center space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-medium text-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            #SejaEducaçãoSST
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
            Comece sua jornada em <span className="text-accent">SST</span> gratuitamente
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Acesse cursos, revistas científicas, aulas ao vivo e uma comunidade de profissionais.
            Sem cartão de crédito.
          </p>
          <Button size="lg" className="h-14 px-8 text-lg font-bold" asChild>
            <Link to="/register">
              Começar Grátis Agora <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <p className="text-sm text-slate-400">100% Gratuito e sem cartão de crédito</p>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container px-4 max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-secondary text-center mb-12">
            O que você recebe ao se cadastrar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-secondary mb-2">{b.title}</h3>
                <p className="text-sm text-slate-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container px-4 max-w-4xl mx-auto text-center mb-12">
          <p className="text-4xl font-serif font-bold text-secondary">2.500+</p>
          <p className="text-slate-600 mt-2">profissionais já fazem parte da plataforma</p>
        </div>
        <div className="container px-4 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-slate-50 rounded-xl p-6 border">
                <p className="text-sm text-slate-700 italic mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${t.seed}`}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-sm text-secondary">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container px-4 max-w-3xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-secondary text-center mb-12">
            Como funciona
          </h2>
          <div className="space-y-8">
            {STEPS.map((step) => (
              <div key={step.n} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-bold text-secondary">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container px-4 max-w-md mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-serif font-bold mb-2">Plano Free</h2>
            <p className="text-primary font-bold text-lg mb-4">
              100% Gratuito e sem cartão de crédito
            </p>
            <ul className="text-left space-y-2 mb-6">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button size="lg" className="w-full h-12 font-bold" asChild>
              <Link to="/register">Criar Conta Grátis</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
