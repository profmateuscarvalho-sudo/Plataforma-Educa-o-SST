/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import './app.css'
import './i18n'

// PWA manifest / theme-color / apple-touch-icon are declared in index.html.

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)

// Subtle install prompt on first mobile visit (beforeinstallprompt).
;(() => {
  let deferred: any = null
  const DISMISS_KEY = 'edu_sst_install_dismissed'
  const beforeInstall = (e: Event) => {
    e.preventDefault()
    deferred = e
    if (localStorage.getItem(DISMISS_KEY)) return
    window.dispatchEvent(new CustomEvent('edu-install-available'))
  }
  window.addEventListener('beforeinstallprompt', beforeInstall)
})()
