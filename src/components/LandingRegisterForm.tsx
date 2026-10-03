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
import { LocationSelect } from '@/components/LocationSelect'
import { PasswordStrengthChecker } from '@/components/PasswordStrengthChecker'
import { useProfessionalTags } from '@/hooks/use-professional-tags'
import '@/styles/3d-effects.css'

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function LandingRegisterForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
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
      setTagsError('Selecione um perfil.')
      return
    }
    if (pass !== passConfirm) {
      setPassError('As senhas não coincidem.')
      return
    }
    if (pass.length < 8 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass)) {
      setPassError('A senha não atende aos requisitos de segurança.')
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
        description: 'Bem-vindo(a) à plataforma Educação SST!',
      })
      navigate('/plataforma')
    }
  }

  return (
    <Card className="w-full glass shadow-3d-lg card-3d border-white/40">
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
          <LocationSelect
            state={state}
            city={city}
            onStateChange={setState}
            onCityChange={setCity}
            required
            compact
          />
          <div className="space-y-1.5">
            <Label className="text-sm">Perfil Profissional</Label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 tag-chip-3d',
                    selectedTags.includes(tag)
                      ? 'bg-primary text-primary-foreground tag-chip-3d-active'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:-translate-y-0.5',
                  )}
                >
                  {selectedTags.includes(tag) && <Check className="w-3 h-3" />}
                  {tag}
                </button>
              ))}
            </div>
            {tagsError && <p className="text-xs font-medium text-destructive">{tagsError}</p>}
          </div>
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
            {pass && <PasswordStrengthChecker password={pass} />}
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
            {passError && <p className="text-xs font-medium text-destructive">{passError}</p>}
          </div>
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
