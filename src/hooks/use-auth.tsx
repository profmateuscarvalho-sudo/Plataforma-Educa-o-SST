import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react'
import pb from '@/lib/pocketbase/client'
import { User } from '@/types'
import { trackAccess } from '@/services/access_events'

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
    planId?: string,
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
  const userRef = useRef(user)
  userRef.current = user

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser((record as User) || null)
    })
    setLoading(false)
    return () => unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, pass: string) => {
    try {
      await pb.collection('users').authWithPassword(email, pass)
      try {
        const rec = pb.authStore.record
        if (rec && rec.role !== 'admin') {
          trackAccess('Hub', 'login')
        }
      } catch {
        /* intentionally ignored */
      }
      return { error: null }
    } catch (error) {
      return { error }
    }
  }, [])

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      pass: string,
      phone?: string,
      professionalTags?: string[],
      city?: string,
      state?: string,
      planId?: string,
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
          plan_id: planId,
        })
        await pb.collection('users').authWithPassword(email, pass)
        return { error: null }
      } catch (error) {
        return { error }
      }
    },
    [],
  )

  const signOut = useCallback(() => {
    pb.authStore.clear()
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      await pb.collection('users').authRefresh()
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [])

  const updateProfile = useCallback(async (data: FormData | Record<string, any>) => {
    const currentUser = userRef.current
    if (!currentUser) return { error: new Error('Usuário não autenticado') }
    try {
      const updated = await pb.collection('users').update(currentUser.id, data)
      pb.authStore.save(pb.authStore.token, updated)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, signIn, signUp, signOut, refreshUser, updateProfile }),
    [user, loading, signIn, signUp, signOut, refreshUser, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
