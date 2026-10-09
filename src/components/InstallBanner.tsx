import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Share, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { useToast } from '@/hooks/use-toast'

const DISMISS_KEY = 'edu_sst_install_dismissed_at'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/** "Agora não" — returns true if the banner is still within its 30-day snooze. */
function isDismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (!at) return false
    return Date.now() - at < THIRTY_DAYS_MS
  } catch {
    return false
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    /* storage unavailable — ignore */
  }
}

/**
 * Visual step-by-step instructions for iOS Safari: Share icon →
 * "Adicionar à Tela de Início". Also used as a friendly fallback when the
 * native `beforeinstallprompt` isn't available (e.g. desktop browsers).
 */
export function InstallInstructionsDialog({
  open,
  onOpenChange,
  isIOS,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  isIOS: boolean
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[28px] border border-border bg-card text-card-foreground p-6">
        <DialogTitle className="font-serif text-xl font-bold text-foreground">
          {t('install.ios.title')}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {t('install.ios.subtitle')}
        </DialogDescription>

        <ol className="mt-4 space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm">
              1
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{t('install.ios.step1')}</p>
              <p className="text-xs text-muted-foreground">{t('install.ios.step1Desc')}</p>
            </div>
            <Share className="h-5 w-5 shrink-0 text-muted-foreground" />
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm">
              2
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{t('install.ios.step2')}</p>
              <p className="text-xs text-muted-foreground">{t('install.ios.step2Desc')}</p>
            </div>
            <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />
          </li>
        </ol>

        {!isIOS && (
          <p className="mt-2 text-xs text-muted-foreground">{t('install.ios.fallback')}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Fixed footer banner inviting users of the main site (not /app) to install
 * the PWA. Shown only on mobile (md:hidden), only after the user has navigated
 * to 2 pages or spent 30s on the site, never when already installed, and snoozed
 * for 30 days when dismissed. Tapping "Instalar" fires the native prompt on
 * Android/Chrome; on iOS Safari it opens a step-by-step modal instead.
 */
export function InstallBanner() {
  const { t } = useTranslation()
  const location = useLocation()
  const { isInstalled, isIOS, canPromptNative, prompt } = useInstallPrompt()

  const [visible, setVisible] = useState(false)
  const [iosOpen, setIosOpen] = useState(false)

  // Eligibility: never when installed, never during the 30-day snooze.
  const eligible = !isInstalled && !isDismissedRecently()

  // Trigger after 2 navigations OR 30s on the site — never immediately.
  useEffect(() => {
    if (!eligible) return

    const navKey = 'edu_sst_nav_count'
    let count = 0
    try {
      count = Number(sessionStorage.getItem(navKey) || 0)
      count += 1
      sessionStorage.setItem(navKey, String(count))
    } catch {
      /* sessionStorage unavailable — fall back to time only */
    }

    const timer = setTimeout(() => setVisible(true), 30_000)
    if (count >= 2) setVisible(true)

    return () => clearTimeout(timer)
  }, [location.pathname, eligible])

  // Hide immediately once installed.
  useEffect(() => {
    if (isInstalled) setVisible(false)
  }, [isInstalled])

  const dismiss = () => {
    setVisible(false)
    rememberDismissal()
  }

  const install = async () => {
    if (isIOS) {
      setIosOpen(true)
      return
    }
    if (canPromptNative) {
      const outcome = await prompt()
      if (outcome === 'accepted') setVisible(false)
      else if (outcome === 'dismissed') {
        setVisible(false)
        rememberDismissal()
      }
      return
    }
    // No native prompt available (e.g. desktop) — show instructions as fallback.
    setIosOpen(true)
  }

  if (!visible) return null

  return (
    <>
      <div
        className="fixed bottom-3 left-3 right-3 z-[80] md:hidden"
        role="dialog"
        aria-label={t('install.banner.aria')}
      >
        <div className="mx-auto flex items-center gap-3 p-3.5 bg-card text-card-foreground rounded-[28px] border border-border shadow-[0_18px_40px_rgba(28,27,24,0.14)] max-w-[480px]">
          <img
            src="/icon-192.png"
            alt={t('install.banner.appName')}
            className="shrink-0 rounded-2xl w-10 h-10 object-cover border border-border"
          />
          <p className="flex-1 min-w-0 text-xs sm:text-sm font-semibold leading-snug text-foreground line-clamp-2">
            {t('install.banner.message')}
          </p>
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-transform active:scale-95 shadow-sm"
          >
            {t('install.banner.install')}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 px-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {t('install.banner.notNow')}
          </button>
        </div>
      </div>

      <InstallInstructionsDialog open={iosOpen} onOpenChange={setIosOpen} isIOS={isIOS} />
    </>
  )
}

/**
 * Shared install-flow trigger for explicit entry points (e.g. the profile
 * menu). Returns `isInstalled` plus a `run()` that fires the native prompt on
 * Android/Chrome or opens the instructions dialog (via the callback) on iOS /
 * when the native prompt is unavailable.
 */
export function useInstallFlow() {
  const { isInstalled, isIOS, canPromptNative, prompt } = useInstallPrompt()
  const { toast } = useToast()
  return {
    isInstalled,
    isIOS,
    async run(onNeedInstructions: () => void) {
      if (isIOS) {
        onNeedInstructions()
        return
      }
      if (canPromptNative) {
        const outcome = await prompt()
        if (outcome === 'accepted') {
          toast({
            title: 'Instalando…',
            description: 'O app está sendo adicionado à sua tela inicial.',
          })
        }
        return
      }
      onNeedInstructions()
    },
  }
}
