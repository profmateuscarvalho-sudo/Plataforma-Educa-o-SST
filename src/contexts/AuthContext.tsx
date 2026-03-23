import React, { createContext, useContext, useState } from 'react'
import { toast } from '@/hooks/use-toast'

export type User = {
  id: string
  name: string
  email: string
  role: 'student' | 'admin'
}

type AuthContextType = {
  user: User | null
  login: (role: 'student' | 'admin') => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = (role: 'student' | 'admin') => {
    setUser({
      id: '1',
      name: role === 'admin' ? 'Administrador' : 'Aluno Exemplo',
      email: role === 'admin' ? 'admin@educacaosst.com.br' : 'aluno@exemplo.com',
      role,
    })
    toast({
      title: 'Login realizado com sucesso',
      description: `Bem-vindo, ${role === 'admin' ? 'Administrador' : 'Aluno'}.`,
    })
  }

  const logout = () => {
    setUser(null)
    toast({ title: 'Sessão encerrada' })
  }

  return React.createElement(AuthContext.Provider, { value: { user, login, logout } }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
