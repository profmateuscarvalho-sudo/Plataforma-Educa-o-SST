import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const PROFESSIONAL_TAGS = [
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

export function LandingRegisterForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
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

    setLoading(true)
    const { error } = await signUp(name, email, pass, phone, selectedTags, city, state)
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
      navigate('/plataforma')
    }
  }

  return (
    <Card className="w-full shadow-2xl border-none">
      <CardContent className="p-6">
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="landing-name" className="text-sm">
              Nome Completo
            </Label>
            <Input
              id="landing-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 bg-slate-50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="landing-email" className="text-sm">
              E-mail
            </Label>
            <Input
              id="landing-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 bg-slate-50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="landing-phone" className="text-sm">
              Telefone
            </Label>
            <Input
              id="landing-phone"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              required
              className="h-10 bg-slate-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="landing-city" className="text-sm">
                Cidade
              </Label>
              <Input
                id="landing-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="h-10 bg-slate-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="landing-state" className="text-sm">
                Estado
              </Label>
              <Input
                id="landing-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="h-10 bg-slate-50"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Perfil Profissional</Label>
            <div className="flex flex-wrap gap-1.5">
              {PROFESSIONAL_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1',
                    selectedTags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  {selectedTags.includes(tag) && <Check className="w-3 h-3" />}
                  {tag}
                </button>
              ))}
            </div>
            {tagsError && <p className="text-xs font-medium text-destructive">{tagsError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="landing-password" className="text-sm">
                Senha
              </Label>
              <Input
                id="landing-password"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                className="h-10 bg-slate-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="landing-password-confirm" className="text-sm">
                Confirmar
              </Label>
              <Input
                id="landing-password-confirm"
                type="password"
                value={passConfirm}
                onChange={(e) => setPassConfirm(e.target.value)}
                required
                className="h-10 bg-slate-50"
              />
            </div>
          </div>
          {passError && <p className="text-xs font-medium text-destructive">{passError}</p>}
          <Button type="submit" className="w-full h-11 text-base font-bold mt-2" disabled={loading}>
            {loading ? 'Criando conta...' : 'Assine Gratuitamente'}
          </Button>
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
