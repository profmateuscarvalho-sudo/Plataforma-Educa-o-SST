import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SquareLogo } from '@/components/ui/Logos'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { LocationSelect } from '@/components/LocationSelect'
import { PasswordStrengthChecker } from '@/components/PasswordStrengthChecker'
import { useProfessionalTags } from '@/hooks/use-professional-tags'

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('planId') || undefined
  const { tags: availableTags } = useProfessionalTags()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [pass, setPass] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [passError, setPassError] = useState('')
  const [tagsError, setTagsError] = useState('')

  const toggleTag = (tag: string) => {
    setTagsError('')
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError('')
    setTagsError('')

    if (selectedTags.length === 0) {
      setTagsError('Selecione pelo menos um perfil profissional.')
      return
    }

    if (pass !== passConfirm) {
      setPassError('As senhas não coincidem.')
      return
    }

    if (pass.length < 8) {
      setPassError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (!/[A-Z]/.test(pass)) {
      setPassError('A senha deve conter pelo menos uma letra maiúscula.')
      return
    }

    if (!/[0-9]/.test(pass)) {
      setPassError('A senha deve conter pelo menos um número.')
      return
    }

    setLoading(true)
    const { error } = await signUp(name, email, pass, phone, selectedTags, city, state, planId)
    setLoading(false)

    if (error) {
      toast({
        title: 'Erro no cadastro',
        description: 'Verifique os dados ou se o e-mail já está em uso.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'E-mail de ativação enviado! Verifique sua caixa de entrada e pasta de spam.',
      })
      if (planId) {
        navigate(`/subscription-pending?planId=${planId}`)
      } else {
        navigate('/subscription-pending')
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-4 text-center items-center pb-8">
          <SquareLogo variant="yellow" className="w-16 h-16 text-5xl mb-2" />
          <div>
            <CardTitle className="font-serif text-3xl text-secondary">Criar Conta</CardTitle>
            <CardDescription className="text-base mt-2">
              Junte-se à maior plataforma de SST
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                required
                className="h-11 bg-slate-50"
              />
            </div>
            <LocationSelect
              state={state}
              city={city}
              onStateChange={setState}
              onCityChange={setCity}
              required
            />
            <div className="space-y-2">
              <Label>Perfil Profissional</Label>
              <p className="text-xs text-slate-400">Selecione uma ou mais opções</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                      selectedTags.includes(tag)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    {selectedTags.includes(tag) && <Check className="w-3.5 h-3.5" />}
                    {tag}
                  </button>
                ))}
              </div>
              {tagsError && (
                <p className="text-sm font-medium text-destructive mt-1">{tagsError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                className="h-11 bg-slate-50"
              />
              {pass && <PasswordStrengthChecker password={pass} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirmar Senha</Label>
              <Input
                id="passwordConfirm"
                type="password"
                value={passConfirm}
                onChange={(e) => setPassConfirm(e.target.value)}
                required
                className="h-11 bg-slate-50"
              />
              {passError && (
                <p className="text-sm font-medium text-destructive mt-1">{passError}</p>
              )}
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-bold mt-2" disabled={loading}>
              {loading ? 'Criando conta...' : 'Cadastrar'}
            </Button>
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Faça login
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
