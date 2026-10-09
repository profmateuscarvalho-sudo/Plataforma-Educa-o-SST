import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ProfileAvatar } from '@/components/student/ProfileAvatar'
import { LocationSelect } from '@/components/LocationSelect'
import { useProfessionalTags } from '@/hooks/use-professional-tags'
import { Check } from 'lucide-react'
import { getUserPayments } from '@/services/payments'
import { getSubscriptionPlans } from '@/services/subscription-plans'
import { Payment, SubscriptionPlan } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Shield, CreditCard, User as UserIcon, Lock, Crown, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function StudentProfile() {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const { tags: availableTags } = useProfessionalTags()

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
  const userTier = user?.role === 'admin' ? 'ouro' : user?.plan_tier || 'free'
  const canUpgrade = userTier !== 'ouro'

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <div className="border-b border-border bg-card py-8">
        <div className="container px-4 max-w-4xl">
          <div className="flex items-center gap-5">
            {user && <ProfileAvatar user={user} size="lg" editable />}
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">
                Meu Perfil
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gerencie suas informações e segurança
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 max-w-4xl py-8 space-y-8">
        <Card className="rounded-[28px] border-border bg-card text-card-foreground shadow-none">
          <CardHeader className="p-6 sm:p-8 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-serif font-semibold text-foreground">
              <UserIcon className="w-5 h-5 text-primary" /> Informações Pessoais
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Atualize seus dados cadastrais
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 pt-0">
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rounded-full border-border bg-card text-foreground min-h-[48px] px-4"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-full border-border bg-card text-foreground min-h-[48px] px-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="rounded-full border-border bg-card text-foreground min-h-[48px] px-4"
                  />
                </div>
              </div>
              <LocationSelect
                state={state}
                city={city}
                onStateChange={setState}
                onCityChange={setCity}
              />
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Perfil Profissional
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setTags((prev) =>
                          prev.includes(p) ? prev.filter((t) => t !== p) : [...prev, p],
                        )
                      }
                      className={cn(
                        'px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 border',
                        tags.includes(p)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-foreground border-border hover:border-foreground/30',
                      )}
                    >
                      {tags.includes(p) && <Check className="w-3.5 h-3.5" />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={savingInfo}
                  className="min-h-[52px] px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {savingInfo ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border bg-card text-card-foreground shadow-none">
          <CardHeader className="p-6 sm:p-8 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-serif font-semibold text-foreground">
              <Lock className="w-5 h-5 text-primary" /> Segurança
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Altere sua senha de acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 pt-0">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPass" className="text-xs font-semibold text-muted-foreground">
                    Nova Senha
                  </Label>
                  <Input
                    id="newPass"
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    className="rounded-full border-border bg-card text-foreground min-h-[48px] px-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPass"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPass"
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                    className="rounded-full border-border bg-card text-foreground min-h-[48px] px-4"
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={savingPass}
                  className="min-h-[52px] px-8 rounded-full border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-muted font-semibold"
                >
                  {savingPass ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border bg-card text-card-foreground shadow-none">
          <CardHeader className="p-6 sm:p-8 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-serif font-semibold text-foreground">
              <CreditCard className="w-5 h-5 text-primary" /> Assinatura e Pagamentos
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Histórico de transações e plano atual
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 pt-0 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-[20px] bg-muted/60 border border-border">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Status da Assinatura</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hasActiveSub
                      ? `Ativa até ${format(new Date(user!.contract_end_date!), 'dd/MM/yyyy', { locale: ptBR })}`
                      : 'Sem assinatura ativa'}
                  </p>
                </div>
              </div>
              <Badge
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  hasActiveSub
                    ? 'bg-[#E3F1E9] text-[#1F6B4A] dark:bg-[#1F6B4A]/30 dark:text-[#E3F1E9] border border-[#1F6B4A]/30'
                    : 'bg-muted text-muted-foreground border-border',
                )}
              >
                {hasActiveSub ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-serif font-semibold text-foreground mb-3">
                Histórico de Pagamentos
              </h4>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum pagamento registrado.
                </p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-4 rounded-[20px] border border-border bg-card"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {p.product_type || 'Produto'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(p.created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-serif font-semibold text-foreground">
                          R$ {(p.amount || 0).toFixed(2)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full px-3 py-0.5 text-xs font-semibold',
                            p.status === 'paid'
                              ? 'border-[#1F6B4A]/30 bg-[#E3F1E9] text-[#1F6B4A] dark:bg-[#1F6B4A]/20 dark:text-[#E3F1E9]'
                              : p.status === 'pending'
                                ? 'border-primary/40 bg-primary/10 text-foreground'
                                : 'border-[#B4472E]/30 bg-[#FAE7E1] text-[#B4472E] dark:bg-[#B4472E]/20 dark:text-[#FAE7E1]',
                          )}
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

            {canUpgrade && (
              <div className="p-5 rounded-[22px] bg-muted/60 border border-border">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-foreground">
                      <Crown className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="font-serif font-semibold text-foreground">
                        Fazer Upgrade de Plano
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Desbloqueie documentários, cursos e mais recursos
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    className="min-h-[44px] px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    <Link to="/planos">
                      Fazer Upgrade <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {plans.length > 0 && (
              <div>
                <h4 className="text-sm font-serif font-semibold text-foreground mb-3">
                  Planos Disponíveis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plans.map((plan) => (
                    <div key={plan.id} className="p-5 rounded-[22px] border border-border bg-card">
                      <p className="font-serif font-semibold text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground mb-3 mt-1 leading-relaxed">
                        {plan.description}
                      </p>
                      <p className="text-lg font-serif font-semibold text-foreground">
                        R$ {plan.price.toFixed(2)}
                        <span className="text-xs font-normal text-muted-foreground">
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
