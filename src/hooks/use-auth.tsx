import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, pass: string) => Promise<{ error: any }>
  signUp: (
    name: string,
    email: string,
    pass: string,
    phone?: string,
    professionalTags?: string[],
    city?: string,
    state?: string,
  ) => Promise<{ error: any }>
  signOut: () => void
  refreshUser: () => Promise<void>
  updateProfile: (data: FormData | Record<string, any>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>((pb.authStore.record as User) || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser((record as User) || null)
    })
    setLoading(false)
    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, pass: string) => {
    try {
      await pb.collection('users').authWithPassword(email, pass)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (
    name: string,
    email: string,
    pass: string,
    phone?: string,
    professionalTags?: string[],
    city?: string,
    state?: string,
  ) => {
    try {
      await pb.collection('users').create({
        name,
        email,
        password: pass,
        passwordConfirm: pass,
        role: 'student',
        phone,
        professional_tags: professionalTags,
        city,
        state,
        plan_tier: 'free',
        subscription_billing: 'none',
      })
      await pb.collection('users').authWithPassword(email, pass)
      return { error: null }
    } catch (error: any) {
      if (error?.status === 400 && error?.response?.data?.email) {
        try {
          await pb.collection('users').authWithPassword(email, pass)
          return { error: null }
        } catch (loginError) {
          return { error: loginError }
        }
      }
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  const refreshUser = async () => {
    try {
      await pb.collection('users').authRefresh()
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  const updateProfile = async (data: FormData | Record<string, any>) => {
    if (!user) return { error: new Error('Usuário não autenticado') }
    try {
      const updated = await pb.collection('users').update(user.id, data)
      pb.authStore.save(pb.authStore.token, updated)
      setUser(updated as User)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, refreshUser, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
