import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SquareLogo } from '@/components/ui/Logos'
import { toast } from '@/hooks/use-toast'

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

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [professionalProfile, setProfessionalProfile] = useState('')
  const [pass, setPass] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [passError, setPassError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError('')

    if (pass !== passConfirm) {
      setPassError('As senhas não coincidem.')
      return
    }

    if (pass.length < 8) {
      setPassError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    setLoading(true)
    const { error } = await signUp(name, email, pass, phone, professionalProfile)
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
        description: 'Bem-vindo à plataforma. Um e-mail de confirmação foi enviado.',
      })
      navigate('/')
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
            <div className="space-y-2">
              <Label>Perfil Profissional</Label>
              <Select value={professionalProfile} onValueChange={setProfessionalProfile} required>
                <SelectTrigger className="h-11 bg-slate-50">
                  <SelectValue placeholder="Selecione seu perfil" />
                </SelectTrigger>
                <SelectContent>
                  {PROFESSIONAL_PROFILES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
