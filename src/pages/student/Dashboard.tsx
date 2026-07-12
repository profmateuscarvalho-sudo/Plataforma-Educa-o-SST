import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useStudentCatalog } from '@/hooks/use-student-catalog'
import { useStudentAccess } from '@/hooks/use-student-access'
import { ProductCard } from '@/components/student/ProductCard'
import { PlanSection } from '@/components/student/PlanSection'
import { CategoryCard } from '@/components/student/CategoryCard'
import { ProfileAvatar } from '@/components/student/ProfileAvatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckoutModal } from '@/components/CheckoutModal'
import {
  ArrowLeft,
  BookOpen,
  Film,
  Newspaper,
  FileCheck,
  Users,
  FileText,
  Sparkles,
  TrendingUp,
  Clock,
  Award,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type ViewType =
  | 'hub'
  | 'cursos'
  | 'documentarios'
  | 'revistas'
  | 'simulados'
  | 'mentorias'
  | 'materiais'
  | 'planos'

const ph = (q: string, w = 800, h = 500) => `https://img.usecurling.com/p/${w}/${h}?q=${q}`

export default function StudentDashboard() {
  const { user, loading } = useAuth()
  const cat = useStudentCatalog()
  const access = useStudentAccess()
  const [view, setView] = useState<ViewType>('hub')
  const [checkout, setCheckout] = useState<{ title: string; price: number } | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  if (loading) return <div className="p-12 text-center text-slate-500">Carregando...</div>
  if (!user) return <Navigate to="/login" />

  const buy = (item: any, category: string) => {
    if (category === 'Mentoria') {
      window.location.href = '/mentorias'
      return
    }
    if (category === 'Revista Digital') {
      setView('planos')
      return
    }
    setCheckout({ title: item.title, price: item.price || 0 })
    setCheckoutOpen(true)
  }

  const imgThumb = (item: any) =>
    item.thumbnail ? pb.files.getUrl(item, item.thumbnail) : ph('education')
  const imgBanner = (item: any) => (item.banner ? pb.files.getUrl(item, item.banner) : ph('exam'))
  const imgDoc = (item: any) =>
    item.presentation_photos?.length
      ? pb.files.getUrl(item, item.presentation_photos[0])
      : ph('documentary')

  const contentGrid = (
    items: any[],
    category: string,
    urlFn: (i: any) => string,
    imgFn: (i: any) => string,
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.length === 0 ? (
        <p className="text-slate-500 col-span-full text-center py-12">
          Nenhum conteúdo disponível.
        </p>
      ) : (
        items.map((item) => {
          const status = access.getAccessStatus(item)
          return (
            <ProductCard
              key={item.id}
              title={item.title}
              description={item.description || item.summary || ''}
              imageUrl={imgFn(item)}
              status={status}
              category={category}
              accessUrl={status !== 'locked' ? urlFn(item) : undefined}
              price={item.price}
              onBuy={status === 'locked' ? () => buy(item, category) : undefined}
            />
          )
        })
      )}
    </div>
  )

  const subActive = access.hasActiveSubscription()
  const freeCount = [
    ...cat.courses.filter((c) => c.is_free),
    ...cat.magazines.filter((m) => m.is_free),
    ...cat.simulados.filter((s) => s.is_free),
  ].length

  const categories = [
    {
      id: 'cursos' as ViewType,
      title: 'Cursos',
      desc: 'Formação completa em SST',
      icon: BookOpen,
      count: cat.courses.length,
      img: ph('online%20course%20education'),
      gradient: 'from-emerald-600 to-teal-800',
    },
    {
      id: 'documentarios' as ViewType,
      title: 'Documentários',
      desc: 'Produções audiovisuais',
      icon: Film,
      count: cat.documentaries.length,
      img: ph('documentary%20film'),
      gradient: 'from-purple-600 to-indigo-800',
    },
    {
      id: 'revistas' as ViewType,
      title: 'Revista Digital',
      desc: 'Conteúdo editorial exclusivo',
      icon: Newspaper,
      count: cat.magazines.length,
      img: ph('digital%20magazine'),
      gradient: 'from-blue-600 to-cyan-800',
    },
    {
      id: 'simulados' as ViewType,
      title: 'Simulados',
      desc: 'Teste seu conhecimento',
      icon: FileCheck,
      count: cat.simulados.length,
      img: ph('exam%20test'),
      gradient: 'from-amber-600 to-orange-800',
    },
    {
      id: 'mentorias' as ViewType,
      title: 'Mentorias',
      desc: 'Acompanhamento especializado',
      icon: Users,
      count: cat.mentorships.length,
      img: ph('mentoring%20meeting'),
      gradient: 'from-rose-600 to-pink-800',
    },
    {
      id: 'planos' as ViewType,
      title: 'Planos',
      desc: 'Assine para acesso ilimitado',
      icon: Sparkles,
      count: cat.plans.length,
      img: ph('subscription%20plan'),
      gradient: 'from-slate-700 to-slate-900',
    },
  ]

  const renderCategory = () => {
    switch (view) {
      case 'cursos':
        return contentGrid(cat.courses, 'Curso', (c) => `/aluno/curso/${c.id}/aula`, imgThumb)
      case 'documentarios':
        return contentGrid(
          cat.documentaries,
          'Documentário',
          (d) => `/documentarios/projeto/${d.slug || d.id}`,
          imgDoc,
        )
      case 'revistas':
        return contentGrid(cat.magazines, 'Revista Digital', () => '/revistas', imgThumb)
      case 'simulados':
        return contentGrid(cat.simulados, 'Simulado', (s) => `/simulados/${s.id}`, imgBanner)
      case 'mentorias':
        return contentGrid(
          cat.mentorships,
          'Mentoria',
          () => '/mentorias',
          () => ph('mentorship'),
        )
      case 'materiais':
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                Os materiais de apoio estão disponíveis dentro de cada curso.
              </p>
              <button
                onClick={() => setView('cursos')}
                className="text-primary font-medium hover:underline mt-2 text-sm"
              >
                Ver cursos →
              </button>
            </CardContent>
          </Card>
        )
      case 'planos':
        return <PlanSection plans={cat.plans} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-secondary text-white py-10">
        <div className="container px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <ProfileAvatar user={user} size="lg" editable />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-serif font-bold text-yellow-400 mb-1">
                Olá, {user.name}!
              </h1>
              <p className="text-slate-300 text-sm">Bem-vindo à sua área de estudos.</p>
              <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                  <BookOpen className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">{cat.courses.length} cursos</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">{cat.completions.length} aulas concluídas</span>
                </div>
                {subActive && user.contract_end_date && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm">
                      Assinatura até{' '}
                      {format(new Date(user.contract_end_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 max-w-6xl py-8">
        {view === 'hub' ? (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-5 flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-secondary">{cat.courses.length}</p>
                    <p className="text-xs text-slate-500">Cursos disponíveis</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-3">
                  <Award className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold text-secondary">{freeCount}</p>
                    <p className="text-xs text-slate-500">Conteúdos gratuitos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-3">
                  <Clock className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold text-secondary">{cat.completions.length}</p>
                    <p className="text-xs text-slate-500">Aulas concluídas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            {!subActive && (
              <Card className="border-amber-200 bg-amber-50 mb-8">
                <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <p className="text-sm text-amber-800 font-medium">
                      {user.contract_end_date
                        ? 'Sua assinatura expirou.'
                        : 'Você não tem assinatura ativa.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setView('planos')}
                    className="text-sm font-bold text-amber-700 hover:underline"
                  >
                    Ver planos →
                  </button>
                </CardContent>
              </Card>
            )}
            <h2 className="text-xl font-serif font-bold text-secondary mb-4">Explorar Conteúdos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((c) => (
                <CategoryCard
                  key={c.id}
                  title={c.title}
                  description={c.desc}
                  icon={c.icon}
                  imageUrl={c.img}
                  count={c.count}
                  gradient={c.gradient}
                  onClick={() => setView(c.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => setView('hub')}
              className="mb-6 text-slate-600 hover:text-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Hub
            </Button>
            {renderCategory()}
          </div>
        )}
      </div>

      <CheckoutModal
        isOpen={checkoutOpen}
        setIsOpen={setCheckoutOpen}
        itemTitle={checkout?.title}
        price={checkout?.price}
      />
    </div>
  )
}
