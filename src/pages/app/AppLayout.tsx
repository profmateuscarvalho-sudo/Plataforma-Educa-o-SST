import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { BottomNav } from '@/components/app/BottomNav'
import { AIFloatingButton } from '@/components/app/AIFloatingButton'
import { InstallPrompt } from '@/components/app/InstallPrompt'
import { subscribePush } from '@/services/appService'

/**
 * Root layout for the /app mobile route. Guards auth (redirecting to /login
 * with a redirect back to /app), renders the bottom nav and the AI floating
 * button, and wraps children in a centered, max-440px mobile container.
 */
export default function AppLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) {
      const to = `/login?redirect=${encodeURIComponent('/app')}`
      navigate(to, { replace: true })
    }
  }, [user, loading, navigate])

  // Register the service worker for offline reading (PWA).
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* offline not available — ignore */
      })
    }
  }, [])

  // Subscribe the browser to push notifications (best-effort, silent fail).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user) return
      try {
        const reg = await navigator.serviceWorker?.ready
        if (!reg) return
        if (Notification.permission === 'default') {
          // Don't be pushy — only ask after the user opts in on Perfil.
          return
        }
        if (Notification.permission !== 'granted') return
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY,
        })
        if (!cancelled && sub) {
          await subscribePush(sub.toJSON() as any)
        }
      } catch {
        /* no VAPID key configured — ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (loading || !user) return null

  return (
    <div className="app-shell" style={{ paddingBottom: 96 }}>
      <div
        className="mx-auto w-full"
        style={{ maxWidth: 440, minHeight: '100dvh', position: 'relative' }}
      >
        <div key={location.pathname} className="sst-page-enter">
          <Outlet />
        </div>
      </div>
      <InstallPrompt />
      <AIFloatingButton />
      <BottomNav />
    </div>
  )
}
