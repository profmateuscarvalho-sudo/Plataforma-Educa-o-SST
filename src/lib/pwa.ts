/**
 * Utilitário de registro e ciclo de vida do Service Worker (PWA).
 *
 * Implementa os 5 requisitos:
 * 1. Busca sempre a versão mais nova do index.html na rede (network-first no sw.js).
 * 2. Versão no nome do cache e limpeza de caches antigos no activate (sw.js).
 * 3. Assunção imediata via skipWaiting e clients.claim (sw.js).
 * 4. Recarrega a página automaticamente se não houver dados preenchidos; se houver,
 *    mostra aviso discreto "Nova versão disponível – Atualizar".
 * 5. Garante que a pré-visualização do editor Skip não use o service worker.
 */

import { toast } from '@/hooks/use-toast'

/**
 * Critério robusto de detecção de preview / editor do Skip:
 * 1. Hostname contendo goskip.app, goskip.dev, ou marcador "--preview" de subdomínio do Skip.
 * 2. Execução dentro de iframe sandboxed do editor (window.self !== window.top).
 * 3. Parâmetro de busca de preview na URL (?preview=... ou ?skip_preview=...).
 * 4. Ambiente de desenvolvimento Vite local (localhost / 127.0.0.1 / ::).
 */
export function isPreviewOrEditorEnvironment(): boolean {
  if (typeof window === 'undefined') return true

  // 1. Checagem de host
  const host = window.location.hostname.toLowerCase()
  if (
    host.includes('goskip.app') ||
    host.includes('goskip.dev') ||
    host.includes('--preview') ||
    host.includes('localhost') ||
    host === '127.0.0.1' ||
    host === '::'
  ) {
    return true
  }

  // 2. Checagem de iframe (o editor do Skip carrega o app em iframe sandboxed)
  try {
    if (window.self !== window.top) {
      return true
    }
  } catch {
    // Se window.top lançou erro de segurança cross-origin, certamente está dentro de iframe
    return true
  }

  // 3. Parâmetros de URL de preview
  const searchParams = new URLSearchParams(window.location.search)
  if (
    searchParams.has('preview') ||
    searchParams.has('skip_preview') ||
    searchParams.has('__preview')
  ) {
    return true
  }

  return false
}

/**
 * Verifica se há formulários em preenchimento pelo usuário na tela atual.
 * Retorna true se encontrar qualquer input/textarea/select com valor não vazio ou em foco.
 */
export function hasUnsavedUserInputs(): boolean {
  if (typeof document === 'undefined') return false

  // Se algum campo está focado no momento
  const active = document.activeElement
  if (
    active &&
    (active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.tagName === 'SELECT' ||
      active.getAttribute('contenteditable') === 'true')
  ) {
    return true
  }

  // Se qualquer formulário possui inputs de texto com valor
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'form input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), form textarea',
  )
  for (const el of inputs) {
    if (el.value && el.value.trim().length > 0) {
      return true
    }
  }

  return false
}

let registrationInstance: ServiceWorkerRegistration | null = null
let hasRegistered = false
let refreshing = false
let noticeShown = false

/**
 * Mostra um aviso discreto no rodapé via toast com instrução para atualizar.
 * Usa texto limpo e direto compatível com o hook padrão useToast.
 */
function showUpdateNotice() {
  if (noticeShown) return
  noticeShown = true

  toast({
    title: 'Nova versão disponível – Atualizar',
    description:
      'Uma atualização foi instalada. Recarregue a página quando terminar o preenchimento.',
  })
}

/**
 * Trata a transição de um novo Service Worker ativo.
 * Se o usuário estiver preenchendo formulários, exibe o aviso discreto.
 * Caso contrário, recarrega a página automaticamente uma única vez.
 */
function handleControllerChange() {
  if (refreshing) return

  if (hasUnsavedUserInputs()) {
    showUpdateNotice()
  } else {
    refreshing = true
    window.location.reload()
  }
}

/**
 * Trata o evento de nova versão detectada enquanto o usuário já tem uma versão rodando.
 */
function handleNewVersionReady() {
  if (hasUnsavedUserInputs()) {
    showUpdateNotice()
  } else {
    // Dá 1 segundo para o novo SW ser ativado via skipWaiting
    setTimeout(() => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    }, 1000)
  }
}

/**
 * Registra o Service Worker com proteção de preview e detecção de atualização.
 */
export function registerAppServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  // Se estiver no preview do editor ou em iframe, NÃO registra o Service Worker.
  // Além disso, limpa qualquer SW residual ou caches antigos criados em testes passados.
  if (isPreviewOrEditorEnvironment()) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {})
      }
    })
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key).catch(() => {})
        }
      })
    }
    return
  }

  if (hasRegistered) return
  hasRegistered = true

  // Registra o sw.js com escopo raiz
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      registrationInstance = registration

      // Checa atualizações ao focar a aba
      window.addEventListener('focus', () => {
        registration.update().catch(() => {})
      })

      // Escuta se há um novo worker aguardando ou instalando
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          // Se o novo worker foi instalado e já existe um controlador ativo (versão anterior)
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            handleNewVersionReady()
          }
        })
      })
    })
    .catch((err) => {
      // Falha silenciosa de offline/SW
      console.warn('Falha ao registrar Service Worker:', err)
    })

  // Quando o controller mudar (skipWaiting + clients.claim assumiram o controle):
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    handleControllerChange()
  })
}

export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return registrationInstance
}
