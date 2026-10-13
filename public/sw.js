/* Educação SST — Service Worker
 *
 * Estratégia de cache:
 * 1. index.html e rotas de navegação: Network-first com fallback para cache
 *    (garante que publicação nova chegue de imediato sem cache stale de HTML).
 * 2. Assets estáticos (JS, CSS, fontes com hash Vite / imagens do site): Cache-first,
 *    pois Vite usa hashing em nomes de arquivo na build de produção.
 * 3. Materiais de leitura / mídia (capas, PDFs, imagens da API): Cache-first com revalidação
 *    em segundo plano para permitir leitura offline de revistas e materiais.
 *
 * Versão do cache:
 * Atualizada a cada publicação (0.0.310-v2). Ao ativar, apaga todos os caches antigos.
 *
 * Ativação imediata:
 * self.skipWaiting() na instalação e self.clients.claim() na ativação.
 */

const CACHE_VERSION = 'edu-sst-v0.0.310-v2'
const SHELL_CACHE = `${CACHE_VERSION}-shell`
const ASSET_CACHE = `${CACHE_VERSION}-assets`
const READING_CACHE = `${CACHE_VERSION}-reading`

const APP_SCREENS = ['/app', '/app/', '/app/estudar', '/app/cases', '/app/perfil', '/login']

// Instalação: pré-armazena as telas essenciais no cache do app e assume o controle imediatamente
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SCREENS).catch(() => {})),
  )
  self.skipWaiting()
})

// Ativação: apaga caches de versões anteriores e assume clientes imediatamente
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

// Suporte a comando manual de skipWaiting (quando o cliente desejar forçar ativação)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function isReadingAsset(url) {
  // Capas de revista, revistas abertas e PDFs/imagens da API PocketBase
  return (
    /\/api\/files\//.test(url) ||
    /\/_\/api\/files\//.test(url) ||
    /\.(png|jpe?g|webp|gif|pdf)(\?|$)/.test(url)
  )
}

function isImmutableStaticAsset(url) {
  // Arquivos estáticos gerados com hash pelo Vite (/assets/*.js, /assets/*.css)
  return /\/assets\/[^/]+\.[a-zA-Z0-9_-]+\.(js|css|woff2?|ttf|eot|svg)$/.test(url)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin

  // 1. Navegação (HTML da aplicação / rotas de páginas):
  // NETWORK-FIRST: busca sempre a versão mais recente na rede. Usa cache só offline.
  if (request.mode === 'navigate' && sameOrigin) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request)
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(SHELL_CACHE)
            cache.put(request, networkResponse.clone()).catch(() => {})
          }
          return networkResponse
        } catch {
          // Sem internet: fallback para o cache do shell ou da requisição
          const cache = await caches.open(SHELL_CACHE)
          const cached =
            (await cache.match(request, { ignoreSearch: true })) ||
            (await cache.match('/app')) ||
            (await cache.match('/'))
          if (cached) return cached
          return new Response(
            '<!doctype html><html><body style="font-family:sans-serif;padding:24px;text-align:center;"><h2>Sem conexão</h2><p>Você está offline no momento. Conecte-se à internet para carregar esta página.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          )
        }
      })(),
    )
    return
  }

  // Se a requisição for para o próprio index.html diretamente
  if (sameOrigin && (url.pathname === '/index.html' || url.pathname === '/')) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request)
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(SHELL_CACHE)
            cache.put(request, networkResponse.clone()).catch(() => {})
          }
          return networkResponse
        } catch {
          const cache = await caches.open(SHELL_CACHE)
          const cached =
            (await cache.match(request, { ignoreSearch: true })) || (await cache.match('/'))
          return cached || new Response('Offline', { status: 503 })
        }
      })(),
    )
    return
  }

  // 2. Materiais de leitura (capas, PDFs, mídias de artigos): cache-first com revalidação
  if (isReadingAsset(url.toString())) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(READING_CACHE)
        const cached = await cache.match(request)
        if (cached) {
          // Revalida em segundo plano sem bloquear exibição
          fetch(request)
            .then((resp) => {
              if (resp && resp.ok) cache.put(request, resp.clone())
            })
            .catch(() => {})
          return cached
        }
        try {
          const resp = await fetch(request)
          if (resp && resp.ok) cache.put(request, resp.clone())
          return resp
        } catch {
          return new Response('', { status: 504 })
        }
      })(),
    )
    return
  }

  // 3. Assets imutáveis do Vite com hash (/assets/*.js, /assets/*.css):
  // Cache-first (têm hash único por build, são imutáveis e 100% seguros em cache)
  if (sameOrigin && isImmutableStaticAsset(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE)
        const cached = await cache.match(request)
        if (cached) return cached
        try {
          const resp = await fetch(request)
          if (resp && resp.ok) cache.put(request, resp.clone())
          return resp
        } catch {
          return new Response('', { status: 504 })
        }
      })(),
    )
    return
  }

  // 4. Outros assets same-origin (ex: /icon.svg, /manifest.json, etc.):
  // Stale-while-revalidate
  if (sameOrigin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE)
        const cached = await cache.match(request)
        const fetchPromise = fetch(request)
          .then((resp) => {
            if (resp && resp.ok) cache.put(request, resp.clone())
            return resp
          })
          .catch(() => cached)
        return cached || fetchPromise
      })(),
    )
  }
})
