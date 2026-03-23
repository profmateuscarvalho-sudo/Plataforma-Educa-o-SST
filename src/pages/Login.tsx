import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
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

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<'student' | 'admin'>('student')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login(role)
    navigate(role === 'admin' ? '/admin' : '/aluno')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-4 text-center items-center pb-8">
          <SquareLogo variant="black" className="w-16 h-16 text-5xl mb-2" />
          <div>
            <CardTitle className="font-serif text-3xl text-secondary">
              Acesso à Plataforma
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Educação e Desenvolvimento em SST
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                defaultValue="demo@educacaosst.com"
                className="h-12 bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                defaultValue="123456"
                className="h-12 bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Simular Tipo de Usuário</Label>
              <Select value={role} onValueChange={(v: 'student' | 'admin') => setRole(v)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Aluno</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-bold">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
