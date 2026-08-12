import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Check, Globe } from 'lucide-react'
import { LANGUAGES, type AppLanguage } from '@/i18n'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark'
  className?: string
}

/**
 * Dropdown language switcher between pt-BR and es.
 * Persists the choice in localStorage via i18next-browser-languagedetector
 * and updates the UI instantly (no page reload) thanks to react-i18next.
 */
export function LanguageSwitcher({ variant = 'light', className }: LanguageSwitcherProps) {
  const { i18n: i18nInstance, t } = useTranslation()
  const current = (i18nInstance.language as AppLanguage) || 'pt-BR'

  const changeLanguage = (lng: AppLanguage) => {
    i18nInstance.changeLanguage(lng)
  }

  const isDark = variant === 'dark'
  const currentMeta = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-1.5 px-2 font-medium',
            isDark ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:text-primary',
            className,
          )}
          aria-label={t('languageSwitcher.label')}
        >
          <Globe className="w-4 h-4" />
          <span className="text-base leading-none">{currentMeta.flag}</span>
          <span className="hidden sm:inline">{currentMeta.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{lang.flag}</span>
              {lang.code === 'pt-BR' ? t('languageSwitcher.ptBR') : t('languageSwitcher.es')}
            </span>
            {current === lang.code && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
