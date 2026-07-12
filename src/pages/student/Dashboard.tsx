import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useStudentCatalog } from '@/hooks/use-student-catalog'
import { useStudentAccess } from '@/hooks/use-student-access'
import { ProductCard } from '@/components/student/ProductCard'
import { PlanSection } from '@/components/student/PlanSection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { CheckoutModal } from '@/components/CheckoutModal'
import { Clock, BookOpen, Award, TrendingUp, FileText } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const ph = (q: string) => `https://img.usecurling.com/p/600/400?q=${q}&color=green`

export default function StudentDashboard() {
  const { user, loading } = useAuth()
  const cat = useStudentCatalog()
  const access = useStudentAccess()
  const [checkout, setCheckout] = useState<{ title: string; price: number } | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [tab, setTab] = useState('inicio')

  if (loading) return <div className="p-12 text-center text-slate-500">Carregando...</div>
  if (!user) return <Navigate to="/login" />

  const buy = (item: any, category: string) => {
    if (category === 'Mentoria') {
      window.location.href = '/mentorias'
      return
    }
    if (category === 'Revista Digital') {
      setTab('planos')
      return
    }
    setCheckout({ title: item.title, price: item.price || 0 })
    setCheckoutOpen(true)
  }

  const grid = (
    items: any[],
    category: string,
    urlFn: (i: any) => string,
    imgFn: (i: any) => string,
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.length === 0 ? (
        <p className="text-slate-500 col-span-full text-center py-8">Nenhum conteúdo disponível.</p>
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

  const imgThumb = (item: any) =>
    item.thumbnail ? pb.files.getURL(item, item.thumbnail) : ph('education')
  const imgBanner = (item: any) => (item.banner ? pb.files.getURL(item, item.banner) : ph('exam'))
  const imgDoc = (item: any) =>
    item.presentation_photos?.length
      ? pb.files.getURL(item, item.presentation_photos[0])
      : ph('documentary')
  const imgNone = () => ph('mentorship')

  const freeCount = [
    ...cat.courses.filter((c) => c.is_free),
    ...cat.magazines.filter((m) => m.is_free),
    ...cat.simulados.filter((s) => s.is_free),
  ].length

  const subActive = access.hasActiveSubscription()

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50">
      <div className="bg-secondary text-white py-10">
        <div className="container px-4 max-w-6xl">
          <h1 className="text-3xl font-serif font-bold text-yellow-400 mb-1">Olá, {user.name}!</h1>
          <p className="text-slate-300 text-sm">Bem-vindo à sua área de estudos.</p>
          <div className="flex flex-wrap gap-4 mt-5">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <BookOpen className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">{cat.courses.length} cursos</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">{cat.completions.length} aulas concluídas</span>
            </div>
            {subActive && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">
                  Assinatura ativa até{' '}
                  {user.contract_end_date
                    ? format(new Date(user.contract_end_date), 'dd/MM/yyyy', { locale: ptBR })
                    : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container px-4 max-w-6xl py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto mb-6">
            <TabsTrigger value="inicio">Início</TabsTrigger>
            <TabsTrigger value="cursos">Cursos</TabsTrigger>
            <TabsTrigger value="documentarios">Documentários</TabsTrigger>
            <TabsTrigger value="revistas">Revista Digital</TabsTrigger>
            <TabsTrigger value="simulados">Simulados</TabsTrigger>
            <TabsTrigger value="mentorias">Mentorias</TabsTrigger>
            <TabsTrigger value="materiais">Materiais</TabsTrigger>
            <TabsTrigger value="planos">Planos</TabsTrigger>
          </TabsList>

          <TabsContent value="inicio" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Card className="border-amber-200 bg-amber-50">
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
                    onClick={() => setTab('planos')}
                    className="text-sm font-bold text-amber-700 hover:underline"
                  >
                    Ver planos →
                  </button>
                </CardContent>
              </Card>
            )}
            {cat.completions.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-secondary mb-3">Continue aprendendo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.courses.slice(0, 3).map((c) => (
                    <ProductCard
                      key={c.id}
                      title={c.title}
                      description={c.description}
                      imageUrl={imgThumb(c)}
                      status={access.getAccessStatus(c)}
                      category="Curso"
                      accessUrl={access.hasAccess(c) ? `/aluno/curso/${c.id}/aula` : undefined}
                      price={c.price}
                      onBuy={() => buy(c, 'Curso')}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cursos">
            {grid(cat.courses, 'Curso', (c) => `/aluno/curso/${c.id}/aula`, imgThumb)}
          </TabsContent>
          <TabsContent value="documentarios">
            {grid(
              cat.documentaries,
              'Documentário',
              (d) => `/documentarios/projeto/${d.slug || d.id}`,
              imgDoc,
            )}
          </TabsContent>
          <TabsContent value="revistas">
            {grid(cat.magazines, 'Revista Digital', () => '/revistas', imgThumb)}
          </TabsContent>
          <TabsContent value="simulados">
            {grid(cat.simulados, 'Simulado', (s) => `/simulados/${s.id}`, imgBanner)}
          </TabsContent>
          <TabsContent value="mentorias">
            {grid(cat.mentorships, 'Mentoria', () => '/mentorias', imgNone)}
          </TabsContent>
          <TabsContent value="materiais">
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  Os materiais de apoio estão disponíveis dentro de cada curso.
                </p>
                <button
                  onClick={() => setTab('cursos')}
                  className="text-primary font-medium hover:underline mt-2 text-sm"
                >
                  Ver cursos →
                </button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="planos">
            <PlanSection plans={cat.plans} />
          </TabsContent>
        </Tabs>
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
