import { useCallback, useEffect, useState } from 'react'

/**
 * The `beforeinstallprompt` event shape. Browsers (mainly Chromium on Android
 * and desktop) fire it right before they would show the native install prompt.
 * We preventDefault it so we can show our own UI and trigger the native one
 * later, on the user's tap.
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallPromptApi {
  /** A captured `beforeinstallprompt` event, if the browser offered one. */
  deferredPrompt: BeforeInstallPromptEvent | null
  /** True when the app is already installed/running standalone (PWA). */
  isInstalled: boolean
  /** True on iOS Safari (which never fires `beforeinstallprompt`). */
  isIOS: boolean
  /** Whether the native install prompt is available right now. */
  canPromptNative: boolean
  /**
   * Triggers the native install prompt. Returns the user's choice outcome, or
   * `'unsupported'` when there is no native prompt to show (e.g. iOS, or the
   * event was already consumed). Callers should fall back to their own iOS
   * instructions when the result is `'unsupported'`.
   */
  prompt: () => Promise<'accepted' | 'dismissed' | 'unsupported'>
}

const isStandalone = () =>
  typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches

const detectIOS = () => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false
  }
  const ua = navigator.userAgent || navigator.platform || ''
  const isIOSDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as Mac with touch points
    (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1)
  // iOS Safari does NOT support beforeinstallprompt; other iOS browsers are
  // just Safari under the hood, so the native prompt path is never available.
  return isIOSDevice
}

/**
 * Captures the PWA `beforeinstallprompt` event, tracks whether the app is
 * already running installed (standalone), and detects iOS so callers can fall
 * back to the "Add to Home Screen" instructions. Also re-checks the installed
 * state when the page returns from background / on visibilitychange, so that
 * the banner disappears right after the user accepts the native prompt.
 */
export function useInstallPrompt(): InstallPromptApi {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState<boolean>(isStandalone())
  const isIOS = detectIOS()

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    const onVisibility = () => {
      // When the tab becomes visible again (e.g. after the user left to confirm
      // the install), re-check the standalone state so the banner hides itself.
      if (document.visibilityState === 'visible') {
        setIsInstalled(isStandalone())
      }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener)
    window.addEventListener('appinstalled', onAppInstalled)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener)
      window.removeEventListener('appinstalled', onAppInstalled)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const prompt = useCallback(async () => {
    if (!deferredPrompt) return 'unsupported' as const
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      if (choice.outcome === 'accepted') {
        setIsInstalled(isStandalone())
      }
      return choice.outcome
    } catch {
      setDeferredPrompt(null)
      return 'unsupported' as const
    }
  }, [deferredPrompt])

  return {
    deferredPrompt,
    isInstalled,
    isIOS,
    canPromptNative: !!deferredPrompt && !isInstalled,
    prompt,
  }
}
