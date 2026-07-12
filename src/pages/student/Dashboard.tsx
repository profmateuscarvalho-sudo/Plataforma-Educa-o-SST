import { useAuth } from '@/hooks/use-auth'
import { Link, Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  PlayCircle,
  CreditCard,
  MessageSquare,
  Video,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCourses } from '@/services/courses'
import { getUserPayments } from '@/services/payments'
import { getLiveSessions } from '@/services/live'
import { createSupportMessage } from '@/services/support'
import { Course, Payment, LiveSession } from '@/types'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function StudentDashboard() {
  const { user, loading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [lives, setLives] = useState<LiveSession[]>([])
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false)

  useEffect(() => {
    if (!user) return

    getCourses().then(setCourses).catch(console.error)
    getUserPayments(user.id).then(setPayments).catch(console.error)
    getLiveSessions()
      .then((data) => setLives(data.filter((s) => s.status !== 'finished')))
      .catch(console.error)
  }, [user])

  const handleSupportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmittingSupport(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createSupportMessage({
        user: user.id,
        subject: fd.get('subject') as string,
        message: fd.get('message') as string,
        status: 'pending',
      })
      toast({
        title: 'Mensagem enviada com sucesso!',
        description: 'Nossa equipe responderá em breve.',
      })
      e.currentTarget.reset()
    } catch (err) {
      toast({ title: 'Erro ao enviar mensagem', variant: 'destructive' })
    } finally {
      setIsSubmittingSupport(false)
    }
  }

  if (loading) return <div className="p-12 text-center text-slate-500">Carregando...</div>
  if (!user || user.role !== 'student') return <Navigate to="/login" />

  return (
    <div className="container px-4 py-10 max-w-6xl min-h-[calc(100vh-80px)]">
      {/* Welcome & Contract Info */}
      <div className="mb-8 p-6 bg-emerald-950 text-white rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-serif font-bold text-yellow-400 mb-2">
            Bem-vindo, {user.name}
          </h1>
          <p className="text-emerald-100/90 text-sm md:text-base">
            Acesse seus materiais de desenvolvimento profissional em SST.
          </p>
        </div>

        {user.contract_end_date && new Date(user.contract_end_date) >= new Date() ? (
          <div className="relative z-10 bg-white/10 px-5 py-3 rounded-xl border border-white/20 flex flex-col items-start md:items-end w-full md:w-auto">
            <span className="text-emerald-200 text-xs uppercase tracking-wider font-bold mb-1">
              Assinatura Ativa
            </span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-lg">
                Válido até{' '}
                {format(new Date(user.contract_end_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative z-10 bg-white/10 px-5 py-3 rounded-xl border border-white/20 flex flex-col items-start md:items-end w-full md:w-auto">
            <span className="text-red-300 text-xs uppercase tracking-wider font-bold mb-1">
              {user.contract_end_date ? 'Assinatura Expirada' : 'Sem Assinatura'}
            </span>
            <Button
              asChild
              size="sm"
              className="mt-1 bg-yellow-400 text-secondary hover:bg-yellow-500"
            >
              <Link to={user.contract_end_date ? '/planos?expired=1' : '/planos'}>
                {user.contract_end_date ? 'Renovar Assinatura' : 'Ver Planos'}
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Courses Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <PlayCircle className="text-secondary w-6 h-6" />
              <h2 className="text-2xl font-bold text-secondary">Meus Cursos</h2>
            </div>

            {courses.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                Nenhum curso disponível no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => {
                  const imgUrl = course.thumbnail
                    ? pb.files.getUrl(course, course.thumbnail)
                    : 'https://img.usecurling.com/p/600/400?q=education&color=green'
                  return (
                    <Card
                      key={course.id}
                      className="overflow-hidden flex flex-col border-slate-200 hover:shadow-md transition-shadow group"
                    >
                      <div className="w-full aspect-video shrink-0 relative overflow-hidden">
                        <img
                          src={imgUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                      </div>
                      <CardContent className="p-5 flex flex-col justify-between flex-1">
                        <h3 className="font-bold text-lg leading-tight mb-4 text-secondary line-clamp-2">
                          {course.title}
                        </h3>
                        <Button asChild className="w-full">
                          <Link to={`/aluno/curso/${course.id}/aula`}>
                            Acessar Plataforma <PlayCircle className="ml-2 w-4 h-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>

          {/* Live Classes Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <Video className="text-red-600 w-6 h-6" />
              <h2 className="text-2xl font-bold text-secondary">Aulas ao Vivo</h2>
            </div>

            {lives.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                Nenhuma aula ao vivo agendada.
              </div>
            ) : (
              <div className="space-y-4">
                {lives.map((session) => (
                  <Card
                    key={session.id}
                    className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-secondary">{session.title}</h3>
                          {session.status === 'live' && (
                            <span className="bg-red-100 text-red-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full animate-pulse">
                              Ao Vivo Agora
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(session.scheduled_at), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                      <Button
                        asChild
                        variant={session.status === 'live' ? 'default' : 'outline'}
                        className={session.status === 'live' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        <Link to={`/aluno/live/${session.id}`}>
                          {session.status === 'live' ? 'Entrar na Aula' : 'Acessar Sala'}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Financial Status */}
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-primary" /> Situação Financeira
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Nenhum registro de pagamento.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {payments.slice(0, 5).map((payment) => (
                    <li
                      key={payment.id}
                      className="p-4 flex justify-between items-center hover:bg-slate-50/50"
                    >
                      <div>
                        <p className="font-medium text-sm text-slate-700">
                          {format(new Date(payment.created), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {payment.product_type || 'Mensalidade'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-secondary">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(payment.amount)}
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-end gap-1 mt-1 ${
                            payment.status === 'paid'
                              ? 'text-emerald-600'
                              : payment.status === 'pending'
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }`}
                        >
                          {payment.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                          {payment.status === 'pending' && <Clock className="w-3 h-3" />}
                          {payment.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                          {payment.status === 'paid'
                            ? 'Pago'
                            : payment.status === 'pending'
                              ? 'Pendente'
                              : 'Falhou'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Support Form */}
          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-primary" /> Dúvidas e Suporte
              </CardTitle>
              <CardDescription>
                Envie sua mensagem diretamente para nossa equipe pedagógica ou administrativa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="subject"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Assunto
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    required
                    placeholder="Ex: Dúvida sobre o módulo 2"
                    className="bg-slate-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="message"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Mensagem
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    placeholder="Como podemos ajudar?"
                    className="min-h-[120px] bg-slate-50 resize-none"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmittingSupport}>
                  {isSubmittingSupport ? (
                    'Enviando...'
                  ) : (
                    <>
                      Enviar Mensagem <Send className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
