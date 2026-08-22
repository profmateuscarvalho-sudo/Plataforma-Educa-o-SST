import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const DISMISS_KEY = 'edu_sst_install_dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Subtle PWA install prompt. Listens for `beforeinstallprompt`, and once it
 * fires shows a small dismissible banner at the top of the /app shell. Stays
 * dismissed for the device until cleared.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return
    const onBefore = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onCustom = () => setVisible(true)
    window.addEventListener('beforeinstallprompt', onBefore)
    window.addEventListener('edu-install-available', onCustom as EventListener)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore)
      window.removeEventListener('edu-install-available', onCustom as EventListener)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  const install = async () => {
    if (!deferred) {
      dismiss()
      return
    }
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  if (!visible) return null

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[90] w-full px-4"
      style={{ top: 8, maxWidth: 424 }}
    >
      <div
        className="sst-tap flex items-center gap-3"
        style={{
          backgroundColor: 'var(--sst-text)',
          color: '#fff',
          borderRadius: 'var(--sst-r-card)',
          padding: '10px 12px',
          boxShadow: '0 6px 20px rgba(21,23,15,0.18)',
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'var(--sst-amber)' }}
        >
          <Download style={{ width: 17, height: 17, color: 'var(--sst-text)' }} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 13, fontWeight: 700 }}>Instalar o app</p>
          <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.66)' }}>
            Acesso rápido pela tela inicial.
          </p>
        </div>
        <button
          onClick={install}
          className="sst-tap shrink-0"
          style={{
            backgroundColor: 'var(--sst-amber)',
            color: 'var(--sst-text)',
            borderRadius: 'var(--sst-r-btn)',
            padding: '7px 12px',
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          Instalar
        </button>
        <button
          onClick={dismiss}
          className="sst-tap shrink-0"
          aria-label="Dispensar"
          style={{ padding: 4 }}
        >
          <X style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.6)' }} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
