import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ptBR from './locales/pt-BR.json'
import es from './locales/es.json'

export const SUPPORTED_LANGUAGES = ['pt-BR', 'es'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export const DEFAULT_LANGUAGE: AppLanguage = 'pt-BR'

// Language metadata for the switcher UI
export const LANGUAGES: { code: AppLanguage; label: string; flag: string }[] = [
  { code: 'pt-BR', label: 'PT', flag: '🇧🇷' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      es: { translation: es },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })

// Normalize any detected language (e.g. "pt", "pt-br") into one we support.
const current = i18n.language
if (!SUPPORTED_LANGUAGES.includes(current as AppLanguage)) {
  const lower = current?.toLowerCase() ?? ''
  const match = lower.startsWith('pt') ? 'pt-BR' : lower.startsWith('es') ? 'es' : DEFAULT_LANGUAGE
  i18n.changeLanguage(match)
}

export default i18n
