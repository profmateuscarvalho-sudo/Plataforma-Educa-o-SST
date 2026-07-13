import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ProfileAvatar } from '@/components/student/ProfileAvatar'
import { Check } from 'lucide-react'
import { getUserPayments } from '@/services/payments'
import { getSubscriptionPlans } from '@/services/subscription-plans'
import { Payment, SubscriptionPlan } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Shield, CreditCard, User as UserIcon, Lock } from 'lucide-react'

const PROFESSIONAL_PROFILES = [
  'Estudante',
  'Técnico em Segurança',
  'Engenheiro de Segurança',
  'Enfermeiro do Trabalho',
  'Médico do Trabalho',
  'Outros',
]

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function StudentProfile() {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [tags, setTags] = useState<string[]>(user?.professional_tags || [])
  const [city, setCity] = useState(user?.city || '')
  const [state, setState] = useState(user?.state || '')
  const [savingInfo, setSavingInfo] = useState(false)

  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [savingPass, setSavingPass] = useState(false)

  const [payments, setPayments] = useState<Payment[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])

  useEffect(() => {
    if (user) {
      getUserPayments(user.id)
        .then(setPayments)
        .catch(() => {})
      getSubscriptionPlans()
        .then(setPlans)
        .catch(() => {})
    }
  }, [user])

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingInfo(true)
    const { error } = await updateProfile({
      name,
      email,
      phone,
      professional_tags: tags,
      city,
      state,
    })
    setSavingInfo(false)
    if (error) {
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' })
    } else {
      toast({ title: 'Perfil atualizado com sucesso!' })
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirmPass) {
      toast({ title: 'As senhas não coincidem.', variant: 'destructive' })
      return
    }
    if (newPass.length < 8) {
      toast({ title: 'A senha deve ter no mínimo 8 caracteres.', variant: 'destructive' })
      return
    }
    setSavingPass(true)
    const { error } = await updateProfile({
      password: newPass,
      passwordConfirm: confirmPass,
    })
    setSavingPass(false)
    if (error) {
      toast({ title: 'Erro ao alterar senha', variant: 'destructive' })
    } else {
      toast({ title: 'Senha alterada com sucesso!' })
      setNewPass('')
      setConfirmPass('')
    }
  }

  const hasActiveSub = user?.contract_end_date && new Date(user.contract_end_date) >= new Date()

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-10">
        <div className="container px-4 max-w-4xl">
          <div className="flex items-center gap-6">
            {user && <ProfileAvatar user={user} size="lg" editable />}
            <div>
              <h1 className="text-3xl font-serif font-bold text-yellow-400">Meu Perfil</h1>
              <p className="text-slate-300 text-sm mt-1">Gerencie suas informações e segurança</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 max-w-4xl py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserIcon className="w-5 h-5 text-primary" /> Informações Pessoais
            </CardTitle>
            <CardDescription>Atualize seus dados cadastrais</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="h-11"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Perfil Profissional</Label>
                <div className="flex flex-wrap gap-2">
                  {PROFESSIONAL_PROFILES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setTags((prev) =>
                          prev.includes(p) ? prev.filter((t) => t !== p) : [...prev, p],
                        )
                      }
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                        tags.includes(p)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      )}
                    >
                      {tags.includes(p) && <Check className="w-3.5 h-3.5" />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={savingInfo} className="h-11">
                {savingInfo ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lock className="w-5 h-5 text-primary" /> Segurança
            </CardTitle>
            <CardDescription>Altere sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPass">Nova Senha</Label>
                  <Input
                    id="newPass"
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPass">Confirmar Senha</Label>
                  <Input
                    id="confirmPass"
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </div>
              <Button type="submit" disabled={savingPass} className="h-11">
                {savingPass ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="w-5 h-5 text-primary" /> Assinatura e Pagamentos
            </CardTitle>
            <CardDescription>Histórico de transações e plano atual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-800">Status da Assinatura</p>
                  <p className="text-sm text-slate-500">
                    {hasActiveSub
                      ? `Ativa até ${format(new Date(user!.contract_end_date!), 'dd/MM/yyyy', { locale: ptBR })}`
                      : 'Sem assinatura ativa'}
                  </p>
                </div>
              </div>
              <Badge
                variant={hasActiveSub ? 'default' : 'outline'}
                className={
                  hasActiveSub
                    ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white'
                    : 'text-slate-500'
                }
              >
                {hasActiveSub ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Histórico de Pagamentos</h4>
              {payments.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  Nenhum pagamento registrado.
                </p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-white"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {p.product_type || 'Produto'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(p.created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-700">
                          R$ {(p.amount || 0).toFixed(2)}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            p.status === 'paid'
                              ? 'border-emerald-500 text-emerald-600'
                              : p.status === 'pending'
                                ? 'border-amber-500 text-amber-600'
                                : 'border-red-500 text-red-600'
                          }
                        >
                          {p.status === 'paid'
                            ? 'Pago'
                            : p.status === 'pending'
                              ? 'Pendente'
                              : 'Falhou'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {plans.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Planos Disponíveis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plans.map((plan) => (
                    <div key={plan.id} className="p-4 rounded-lg border bg-white">
                      <p className="font-bold text-slate-800">{plan.name}</p>
                      <p className="text-sm text-slate-500 mb-2">{plan.description}</p>
                      <p className="text-lg font-bold text-primary">
                        R$ {plan.price.toFixed(2)}
                        <span className="text-sm font-normal text-slate-400">
                          /{plan.interval === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
